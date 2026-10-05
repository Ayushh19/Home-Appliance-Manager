import { createTeamMemberSchema, OPEN_REQUEST_STATUSES, serviceCenterProfileSchema, type ServiceCenterProfile } from '@ham/shared';
import { and, asc, count, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import { db } from '../db/client.js';
import { serviceCenterBrands, serviceCenterCategories, serviceCenters, serviceRequests, users } from '../db/schema.js';
import { HttpError, isUniqueViolation, parseBody } from '../lib/http.js';
import { hashPassword } from '../lib/password.js';
import { requireRole } from '../lib/session.js';
import { assertCatalogLists } from './catalog.js';

// Service center staff only. Every query is scoped to the staff member's own center.
export const centerRouter = Router();
centerRouter.use(requireRole('center_staff'));

const memberColumns = { id: users.id, name: users.name, email: users.email, phone: users.phone };
type TeamRole = 'technician' | 'center_staff';

async function listMembers(req: Request, res: Response, role: TeamRole) {
  const rows = await db
    .select(memberColumns)
    .from(users)
    .where(and(eq(users.serviceCenterId, req.user!.serviceCenter!.id), eq(users.role, role)))
    .orderBy(asc(users.name));
  res.json(rows);
}

// Staff create technician and staff accounts directly (docs/DECISIONS.md #22, #29).
async function createMember(req: Request, res: Response, role: TeamRole) {
  const input = parseBody(createTeamMemberSchema, req.body);
  try {
    const [member] = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        role,
        serviceCenterId: req.user!.serviceCenter!.id,
      })
      .returning(memberColumns);
    res.status(201).json(member);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HttpError(409, 'An account with this email already exists.', { email: 'This email is already registered' });
    }
    throw err;
  }
}

centerRouter.get('/technicians', (req, res) => listMembers(req, res, 'technician'));
centerRouter.post('/technicians', (req, res) => createMember(req, res, 'technician'));
centerRouter.get('/staff', (req, res) => listMembers(req, res, 'center_staff'));
centerRouter.post('/staff', (req, res) => createMember(req, res, 'center_staff'));

// ---------- The center itself (docs/DECISIONS.md #34–#36) ----------

async function openRequestCount(centerId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(serviceRequests)
    .where(and(eq(serviceRequests.serviceCenterId, centerId), inArray(serviceRequests.status, OPEN_REQUEST_STATUSES)));
  return row!.n;
}

async function loadProfile(centerId: string): Promise<ServiceCenterProfile> {
  const [[center], categoryRows, brandRows, open] = await Promise.all([
    db.select().from(serviceCenters).where(eq(serviceCenters.id, centerId)),
    db
      .select({ id: serviceCenterCategories.categoryId })
      .from(serviceCenterCategories)
      .where(eq(serviceCenterCategories.serviceCenterId, centerId)),
    db.select({ id: serviceCenterBrands.brandId }).from(serviceCenterBrands).where(eq(serviceCenterBrands.serviceCenterId, centerId)),
    openRequestCount(centerId),
  ]);
  return {
    id: center!.id,
    name: center!.name,
    address: center!.address,
    phone: center!.phone,
    email: center!.email,
    categoryIds: categoryRows.map((r) => r.id),
    brandIds: brandRows.map((r) => r.id),
    closedAt: center!.closedAt?.toISOString() ?? null,
    openRequestCount: open,
  };
}

centerRouter.get('/profile', async (req, res) => {
  res.json(await loadProfile(req.user!.serviceCenter!.id));
});

// Removing a type or brand only stops new requests for it; existing requests carry on.
centerRouter.patch('/profile', async (req, res) => {
  const centerId = req.user!.serviceCenter!.id;
  const input = parseBody(serviceCenterProfileSchema, req.body);
  const { categoryIds, brandIds } = await assertCatalogLists(input.categoryIds, input.brandIds);
  await db.transaction(async (tx) => {
    await tx.update(serviceCenters).set(input.center).where(eq(serviceCenters.id, centerId));
    await tx.delete(serviceCenterCategories).where(eq(serviceCenterCategories.serviceCenterId, centerId));
    await tx.insert(serviceCenterCategories).values(categoryIds.map((categoryId) => ({ serviceCenterId: centerId, categoryId })));
    await tx.delete(serviceCenterBrands).where(eq(serviceCenterBrands.serviceCenterId, centerId));
    await tx.insert(serviceCenterBrands).values(brandIds.map((brandId) => ({ serviceCenterId: centerId, brandId })));
  });
  res.json(await loadProfile(centerId));
});

// Closing hides the center from customers; it's blocked while requests are open.
centerRouter.post('/close', async (req, res) => {
  const centerId = req.user!.serviceCenter!.id;
  const open = await openRequestCount(centerId);
  if (open > 0) {
    throw new HttpError(
      409,
      `Finish or reject your ${open} open ${open === 1 ? 'request' : 'requests'} before closing the center.`,
    );
  }
  await db.update(serviceCenters).set({ closedAt: new Date() }).where(and(eq(serviceCenters.id, centerId), isNull(serviceCenters.closedAt)));
  res.json(await loadProfile(centerId));
});

centerRouter.post('/reopen', async (req, res) => {
  const centerId = req.user!.serviceCenter!.id;
  await db.update(serviceCenters).set({ closedAt: null }).where(and(eq(serviceCenters.id, centerId), isNotNull(serviceCenters.closedAt)));
  res.json(await loadProfile(centerId));
});
