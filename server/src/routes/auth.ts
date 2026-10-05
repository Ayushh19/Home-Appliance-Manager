import {
  loginSchema,
  registerCustomerSchema,
  registerServiceCenterSchema,
  type SessionUser,
} from '@ham/shared';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db/client.js';
import {
  serviceCenterBrands,
  serviceCenterCategories,
  serviceCenters,
  users,
} from '../db/schema.js';
import { HttpError, isUniqueViolation, parseBody } from '../lib/http.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { assertCatalogLists } from './catalog.js';
import { endSession, getSessionUser, requireRole, SESSION_COOKIE, startSession } from '../lib/session.js';

export const authRouter = Router();

const emailTaken = (field: string) =>
  new HttpError(409, 'An account with this email already exists.', { [field]: 'This email is already registered' });

authRouter.post('/register/customer', async (req, res) => {
  const input = parseBody(registerCustomerSchema, req.body);
  let userId: string;
  try {
    const [user] = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        role: 'customer',
      })
      .returning({ id: users.id });
    userId = user!.id;
  } catch (err) {
    if (isUniqueViolation(err)) throw emailTaken('email');
    throw err;
  }
  await startSession(res, userId);
  res.status(201).json(await getSessionUser(userId));
});

authRouter.post('/register/service-center', async (req, res) => {
  const input = parseBody(registerServiceCenterSchema, req.body);
  // Only values from the built-in lists are allowed.
  const { categoryIds, brandIds } = await assertCatalogLists(input.categoryIds, input.brandIds);

  const passwordHash = await hashPassword(input.staff.password);
  let userId: string;
  try {
    userId = await db.transaction(async (tx) => {
      const [center] = await tx.insert(serviceCenters).values(input.center).returning({ id: serviceCenters.id });
      const serviceCenterId = center!.id;
      await tx.insert(serviceCenterCategories).values(categoryIds.map((categoryId) => ({ serviceCenterId, categoryId })));
      await tx.insert(serviceCenterBrands).values(brandIds.map((brandId) => ({ serviceCenterId, brandId })));
      const [staff] = await tx
        .insert(users)
        .values({
          name: input.staff.name,
          email: input.staff.email,
          phone: input.staff.phone,
          passwordHash,
          role: 'center_staff',
          serviceCenterId,
        })
        .returning({ id: users.id });
      return staff!.id;
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw emailTaken('staff.email');
    throw err;
  }
  await startSession(res, userId);
  res.status(201).json(await getSessionUser(userId));
});

authRouter.post('/login', async (req, res) => {
  const input = parseBody(loginSchema, req.body);
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, input.email));
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, 'Incorrect email or password.');
  }
  const sessionUser = await getSessionUser(user.id);
  if (sessionUser?.role === 'technician' && sessionUser.serviceCenter?.closed) {
    throw new HttpError(403, 'Your service center is closed. You can sign in again once it reopens.');
  }
  await startSession(res, user.id);
  res.json(await getSessionUser(user.id));
});

authRouter.post('/logout', async (req, res) => {
  await endSession(res, req.cookies?.[SESSION_COOKIE]);
  res.status(204).end();
});

authRouter.get('/me', requireRole(), (req, res) => {
  res.json(req.user satisfies SessionUser | undefined);
});
