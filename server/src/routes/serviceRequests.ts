// Service requests: the flow between customer, service center staff and technician.
// Statuses and who may change them: docs/SERVICE_REQUEST_FLOW.md.
import {
  addMonths,
  assignTechnicianSchema,
  CANCELLABLE_STATUSES,
  completeServiceRequestSchema,
  createServiceRequestSchema,
  progressNoteSchema,
  proposeVisitSchema,
  rejectServiceRequestSchema,
  resendServiceRequestSchema,
  respondVisitSchema,
  todayIso,
  type RequestStatus,
  type ServiceCenterOption,
  type ServiceRequestDetail,
  type SessionUser,
} from '@ham/shared';
import { and, asc, desc, eq, inArray, isNull, notInArray, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { Router } from 'express';
import { brandName, categoryName } from '../lib/assetNames.js';
import { db } from '../db/client.js';
import {
  assetCategories,
  assets,
  brands,
  homes,
  maintenanceSchedules,
  requestAssignments,
  requestUpdates,
  serviceCenterBrands,
  serviceCenterCategories,
  serviceCenters,
  serviceRecords,
  serviceRequests,
  users,
  visitProposals,
  warranties,
} from '../db/schema.js';
import { refreshReminders } from '../jobs/reminders.js';
import { HttpError, parseBody } from '../lib/http.js';
import { ownedAsset } from '../lib/ownership.js';
import { listServiceRequests, serviceRecordsFor } from '../lib/serviceRequests.js';
import { requireRole } from '../lib/session.js';

export const serviceRequestsRouter = Router(); // mounted at /api/service-requests
export const serviceCentersRouter = Router(); // mounted at /api/service-centers
for (const router of [serviceRequestsRouter, serviceCentersRouter]) router.use(requireRole());

function assertRole(user: SessionUser, role: SessionUser['role']) {
  if (user.role !== role) throw new HttpError(403, 'You do not have access to this.');
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Open centers that support both the asset's category and brand, excluding `exclude`. */
async function matchingCenters(assetId: string, exclude: string[] = []): Promise<ServiceCenterOption[]> {
  const [asset] = await db
    .select({ categoryId: assets.categoryId, brandId: assets.brandId })
    .from(assets)
    .where(eq(assets.id, assetId));
  if (!asset) return [];
  const conditions: SQL[] = [
    eq(serviceCenterCategories.categoryId, asset.categoryId),
    eq(serviceCenterBrands.brandId, asset.brandId),
    isNull(serviceCenters.closedAt), // closed centers can't receive requests (docs/DECISIONS.md #35)
  ];
  if (exclude.length) conditions.push(notInArray(serviceCenters.id, exclude));
  return db
    .select({ id: serviceCenters.id, name: serviceCenters.name, address: serviceCenters.address, phone: serviceCenters.phone })
    .from(serviceCenters)
    .innerJoin(serviceCenterCategories, eq(serviceCenterCategories.serviceCenterId, serviceCenters.id))
    .innerJoin(serviceCenterBrands, eq(serviceCenterBrands.serviceCenterId, serviceCenters.id))
    .where(and(...conditions))
    .orderBy(asc(serviceCenters.name));
}

async function rejectedByCenterIds(requestId: string): Promise<string[]> {
  const rows = await db
    .select({ id: requestAssignments.serviceCenterId })
    .from(requestAssignments)
    .where(and(eq(requestAssignments.serviceRequestId, requestId), eq(requestAssignments.event, 'rejected')));
  return [...new Set(rows.map((r) => r.id))];
}

serviceCentersRouter.get('/', async (req, res) => {
  assertRole(req.user!, 'customer');
  const assetId = String(req.query.assetId ?? '');
  await ownedAsset(assetId, req.user!.id);
  const requestId = typeof req.query.requestId === 'string' && UUID.test(req.query.requestId) ? req.query.requestId : null;
  res.json(await matchingCenters(assetId, requestId ? await rejectedByCenterIds(requestId) : []));
});

// ---------- Loading a request the signed-in user may see ----------

/** What each role may see: customers their own, staff their center's, technicians those assigned to them. */
function accessCondition(user: SessionUser): SQL {
  if (user.role === 'customer') return eq(serviceRequests.customerId, user.id);
  if (user.role === 'center_staff') return eq(serviceRequests.serviceCenterId, user.serviceCenter!.id);
  return eq(serviceRequests.technicianId, user.id);
}

async function visibleRequest(requestId: string, user: SessionUser) {
  if (!UUID.test(requestId)) throw new HttpError(404, 'Service request not found.');
  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, requestId), accessCondition(user)));
  if (!request) throw new HttpError(404, 'Service request not found.');
  return request;
}

function requireStatus(status: RequestStatus, allowed: readonly RequestStatus[], action: string) {
  if (!allowed.includes(status)) throw new HttpError(409, `This request can't be ${action} right now. Refresh to see its latest status.`);
}

/**
 * Moves a request from one of `from` to `to` and logs it, failing with 409 if someone else changed it first.
 */
async function transition(
  tx: Tx,
  requestId: string,
  userId: string,
  from: readonly RequestStatus[],
  to: RequestStatus,
  changes: Partial<typeof serviceRequests.$inferInsert> = {},
  note?: string,
) {
  const [before] = await tx
    .select({ status: serviceRequests.status })
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .for('update');
  if (!before || !from.includes(before.status)) {
    throw new HttpError(409, 'This request has just changed. Refresh to see its latest status.');
  }
  await tx.update(serviceRequests).set({ ...changes, status: to }).where(eq(serviceRequests.id, requestId));
  await tx.insert(requestUpdates).values({ serviceRequestId: requestId, userId, fromStatus: before.status, toStatus: to, note });
}

async function withdrawOpenVisits(tx: Tx, requestId: string) {
  await tx
    .update(visitProposals)
    .set({ status: 'withdrawn' })
    .where(and(eq(visitProposals.serviceRequestId, requestId), inArray(visitProposals.status, ['pending', 'confirmed'])));
}

// ---------- Customer ----------

// Create: lives under the asset, mounted at /api/assets/:assetId/service-requests (see assets router).
export async function createServiceRequest(assetId: string, user: SessionUser, body: unknown) {
  const asset = await ownedAsset(assetId, user.id);
  if (asset.status !== 'active') throw new HttpError(409, 'Service can only be requested for assets that are in use.');
  const input = parseBody(createServiceRequestSchema, body);

  let scheduleId: string | null = null;
  if (input.type === 'maintenance' && input.maintenanceScheduleId) {
    const [schedule] = await db
      .select({ id: maintenanceSchedules.id })
      .from(maintenanceSchedules)
      .where(and(eq(maintenanceSchedules.id, input.maintenanceScheduleId), eq(maintenanceSchedules.assetId, assetId)));
    if (!schedule) throw new HttpError(400, 'Choose one of this asset\'s schedules.', { maintenanceScheduleId: 'Unknown schedule' });
    scheduleId = schedule.id;
  }
  const centers = await matchingCenters(assetId);
  if (!centers.some((c) => c.id === input.serviceCenterId)) {
    throw new HttpError(400, 'Choose a service center that supports this asset.', { serviceCenterId: 'Not available for this asset' });
  }

  return db.transaction(async (tx) => {
    const [request] = await tx
      .insert(serviceRequests)
      .values({
        assetId,
        customerId: user.id,
        serviceCenterId: input.serviceCenterId,
        type: input.type,
        maintenanceScheduleId: scheduleId,
        description: input.description,
      })
      .returning({ id: serviceRequests.id });
    await tx.insert(requestUpdates).values({ serviceRequestId: request!.id, userId: user.id, toStatus: 'new' });
    await tx.insert(requestAssignments).values({
      serviceRequestId: request!.id,
      serviceCenterId: input.serviceCenterId,
      assignedBy: user.id,
      event: 'sent_to_center',
    });
    return request!;
  });
}

serviceRequestsRouter.post('/:requestId/cancel', async (req, res) => {
  assertRole(req.user!, 'customer');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, CANCELLABLE_STATUSES, 'cancelled');
  await db.transaction(async (tx) => {
    await transition(tx, request.id, req.user!.id, CANCELLABLE_STATUSES, 'cancelled');
    await withdrawOpenVisits(tx, request.id);
  });
  res.status(204).end();
});

// After a rejection the customer sends the same request to another center (docs/DECISIONS.md #25).
serviceRequestsRouter.post('/:requestId/resend', async (req, res) => {
  assertRole(req.user!, 'customer');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, ['rejected'], 'sent to another center');
  const { serviceCenterId } = parseBody(resendServiceRequestSchema, req.body);
  const centers = await matchingCenters(request.assetId, await rejectedByCenterIds(request.id));
  if (!centers.some((c) => c.id === serviceCenterId)) {
    throw new HttpError(400, 'Choose another service center that supports this asset.', { serviceCenterId: 'Not available' });
  }
  await db.transaction(async (tx) => {
    await transition(tx, request.id, req.user!.id, ['rejected'], 'new', { serviceCenterId, technicianId: null });
    await tx.insert(requestAssignments).values({
      serviceRequestId: request.id,
      serviceCenterId,
      assignedBy: req.user!.id,
      event: 'sent_to_center',
    });
  });
  res.status(204).end();
});

serviceRequestsRouter.post('/:requestId/visits/:visitId/respond', async (req, res) => {
  assertRole(req.user!, 'customer');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, ['assigned'], 'scheduled');
  const { response } = parseBody(respondVisitSchema, req.body);
  if (!UUID.test(req.params.visitId)) throw new HttpError(404, 'Visit not found.');
  const updated = await db
    .update(visitProposals)
    .set({ status: response === 'confirm' ? 'confirmed' : 'declined', respondedAt: new Date() })
    .where(
      and(
        eq(visitProposals.id, req.params.visitId),
        eq(visitProposals.serviceRequestId, request.id),
        eq(visitProposals.status, 'pending'),
      ),
    )
    .returning({ id: visitProposals.id });
  if (!updated.length) throw new HttpError(409, 'This visit time is no longer open. Refresh to see the latest.');
  res.status(204).end();
});

// ---------- Service center staff ----------

serviceRequestsRouter.post('/:requestId/accept', async (req, res) => {
  assertRole(req.user!, 'center_staff');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, ['new'], 'accepted');
  await db.transaction((tx) => transition(tx, request.id, req.user!.id, ['new'], 'accepted'));
  res.status(204).end();
});

serviceRequestsRouter.post('/:requestId/reject', async (req, res) => {
  assertRole(req.user!, 'center_staff');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, ['new'], 'rejected');
  const { reason } = parseBody(rejectServiceRequestSchema, req.body);
  await db.transaction(async (tx) => {
    await transition(tx, request.id, req.user!.id, ['new'], 'rejected', {}, reason);
    await tx.insert(requestAssignments).values({
      serviceRequestId: request.id,
      serviceCenterId: request.serviceCenterId,
      assignedBy: req.user!.id,
      event: 'rejected',
      reason,
    });
  });
  res.status(204).end();
});

// Assign (from accepted) or reassign (while assigned, before work starts — see docs/OPEN_QUESTIONS.md).
serviceRequestsRouter.post('/:requestId/assign', async (req, res) => {
  assertRole(req.user!, 'center_staff');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, ['accepted', 'assigned'], 'assigned');
  const { technicianId } = parseBody(assignTechnicianSchema, req.body);
  const [technician] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, technicianId), eq(users.role, 'technician'), eq(users.serviceCenterId, request.serviceCenterId)));
  if (!technician) throw new HttpError(400, 'Choose one of your technicians.', { technicianId: 'Unknown technician' });
  if (technicianId === request.technicianId) throw new HttpError(400, 'This technician is already assigned.', { technicianId: 'Already assigned' });

  const reassign = request.status === 'assigned';
  await db.transaction(async (tx) => {
    if (reassign) {
      const [locked] = await tx
        .select({ status: serviceRequests.status })
        .from(serviceRequests)
        .where(eq(serviceRequests.id, request.id))
        .for('update');
      if (locked?.status !== 'assigned') throw new HttpError(409, 'This request has just changed. Refresh to see its latest status.');
      await tx.update(serviceRequests).set({ technicianId }).where(eq(serviceRequests.id, request.id));
      // The new technician proposes a fresh visit time.
      await withdrawOpenVisits(tx, request.id);
    } else {
      await transition(tx, request.id, req.user!.id, ['accepted'], 'assigned', { technicianId });
    }
    await tx.insert(requestAssignments).values({
      serviceRequestId: request.id,
      serviceCenterId: request.serviceCenterId,
      technicianId,
      assignedBy: req.user!.id,
      event: reassign ? 'technician_reassigned' : 'technician_assigned',
    });
  });
  res.status(204).end();
});

// ---------- Technician ----------

serviceRequestsRouter.post('/:requestId/visits', async (req, res) => {
  assertRole(req.user!, 'technician');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, ['assigned'], 'scheduled');
  const { proposedAt } = parseBody(proposeVisitSchema, req.body);
  const open = await db
    .select({ status: visitProposals.status })
    .from(visitProposals)
    .where(and(eq(visitProposals.serviceRequestId, request.id), inArray(visitProposals.status, ['pending', 'confirmed'])));
  if (open.some((v) => v.status === 'confirmed')) throw new HttpError(409, 'A visit time is already confirmed.');
  if (open.some((v) => v.status === 'pending')) throw new HttpError(409, 'Wait for the customer to answer the current proposal.');
  await db.insert(visitProposals).values({ serviceRequestId: request.id, proposedBy: req.user!.id, proposedAt: new Date(proposedAt) });
  res.status(201).end();
});

serviceRequestsRouter.post('/:requestId/start', async (req, res) => {
  assertRole(req.user!, 'technician');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, ['assigned'], 'started');
  const [confirmed] = await db
    .select({ id: visitProposals.id })
    .from(visitProposals)
    .where(and(eq(visitProposals.serviceRequestId, request.id), eq(visitProposals.status, 'confirmed')));
  // docs/DECISIONS.md #19
  if (!confirmed) throw new HttpError(409, 'The customer has to confirm a visit time before work can start.');
  await db.transaction((tx) => transition(tx, request.id, req.user!.id, ['assigned'], 'in_progress'));
  res.status(204).end();
});

serviceRequestsRouter.post('/:requestId/notes', async (req, res) => {
  assertRole(req.user!, 'technician');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, ['assigned', 'in_progress'], 'updated');
  const { note } = parseBody(progressNoteSchema, req.body);
  await db.insert(requestUpdates).values({ serviceRequestId: request.id, userId: req.user!.id, note });
  res.status(201).end();
});

serviceRequestsRouter.post('/:requestId/complete', async (req, res) => {
  assertRole(req.user!, 'technician');
  const request = await visibleRequest(req.params.requestId, req.user!);
  requireStatus(request.status, ['in_progress'], 'completed');
  const input = parseBody(completeServiceRequestSchema, req.body);
  const serviceDate = todayIso();

  await db.transaction(async (tx) => {
    await transition(tx, request.id, req.user!.id, ['in_progress'], 'completed');
    // The completed service becomes part of the asset's history (docs/SERVICE_REQUEST_FLOW.md).
    await tx.insert(serviceRecords).values({
      assetId: request.assetId,
      serviceRequestId: request.id,
      source: 'request',
      type: request.type,
      maintenanceScheduleId: request.type === 'maintenance' ? request.maintenanceScheduleId : null,
      serviceDate,
      problem: request.description,
      workDone: input.workDone,
      partsReplaced: input.partsReplaced,
      cost: input.cost,
      performedBy: `${req.user!.name}, ${req.user!.serviceCenter!.name}`,
    });
    if (request.type === 'maintenance' && request.maintenanceScheduleId) {
      await moveScheduleForward(tx, request.maintenanceScheduleId, serviceDate);
    }
  });
  await refreshReminders();
  res.status(204).end();
});

/** Next due = service date + interval, only ever moving the date later (docs/DECISIONS.md #17, #20, #21). */
export async function moveScheduleForward(tx: Tx, scheduleId: string, serviceDate: string) {
  const [schedule] = await tx
    .select({ intervalMonths: maintenanceSchedules.intervalMonths, nextDueDate: maintenanceSchedules.nextDueDate })
    .from(maintenanceSchedules)
    .where(eq(maintenanceSchedules.id, scheduleId));
  if (!schedule) return;
  const next = addMonths(serviceDate, schedule.intervalMonths);
  if (next > schedule.nextDueDate) {
    await tx.update(maintenanceSchedules).set({ nextDueDate: next }).where(eq(maintenanceSchedules.id, scheduleId));
  }
}

// ---------- Reading ----------

serviceRequestsRouter.get('/', async (req, res) => {
  res.json(await listServiceRequests(accessCondition(req.user!)));
});

serviceRequestsRouter.get('/:requestId', async (req, res) => {
  const request = await visibleRequest(req.params.requestId, req.user!);
  const customer = alias(users, 'customer');
  const technician = alias(users, 'technician');

  const [row] = await db
    .select({
      asset: {
        id: assets.id,
        category: categoryName,
        brand: brandName,
        name: assets.name,
        model: assets.model,
        serialNumber: assets.serialNumber,
        purchaseDate: assets.purchaseDate,
      },
      home: { name: homes.name, address: homes.address },
      customer: { name: customer.name, email: customer.email, phone: customer.phone },
      center: {
        id: serviceCenters.id,
        name: serviceCenters.name,
        address: serviceCenters.address,
        phone: serviceCenters.phone,
        email: serviceCenters.email,
      },
      technicianId: technician.id,
      technicianName: technician.name,
      technicianPhone: technician.phone,
      scheduleId: maintenanceSchedules.id,
      scheduleTitle: maintenanceSchedules.title,
    })
    .from(serviceRequests)
    .innerJoin(assets, eq(serviceRequests.assetId, assets.id))
    .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .innerJoin(brands, eq(assets.brandId, brands.id))
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .innerJoin(customer, eq(serviceRequests.customerId, customer.id))
    .innerJoin(serviceCenters, eq(serviceRequests.serviceCenterId, serviceCenters.id))
    .leftJoin(technician, eq(serviceRequests.technicianId, technician.id))
    .leftJoin(maintenanceSchedules, eq(serviceRequests.maintenanceScheduleId, maintenanceSchedules.id))
    .where(eq(serviceRequests.id, request.id));

  const assignedBy = alias(users, 'assigned_by');
  const assignedTech = alias(users, 'assigned_tech');
  const [warrantyRows, visitRows, updateRows, assignmentRows, records] = await Promise.all([
    db
      .select({ startDate: warranties.startDate, endDate: warranties.endDate, details: warranties.details })
      .from(warranties)
      .where(eq(warranties.assetId, request.assetId))
      .orderBy(asc(warranties.endDate)),
    db.select().from(visitProposals).where(eq(visitProposals.serviceRequestId, request.id)).orderBy(desc(visitProposals.createdAt)),
    db
      .select({
        id: requestUpdates.id,
        fromStatus: requestUpdates.fromStatus,
        toStatus: requestUpdates.toStatus,
        note: requestUpdates.note,
        createdAt: requestUpdates.createdAt,
        userName: users.name,
        userRole: users.role,
      })
      .from(requestUpdates)
      .innerJoin(users, eq(requestUpdates.userId, users.id))
      .where(eq(requestUpdates.serviceRequestId, request.id))
      .orderBy(asc(requestUpdates.createdAt)),
    db
      .select({
        id: requestAssignments.id,
        event: requestAssignments.event,
        serviceCenterId: requestAssignments.serviceCenterId,
        centerName: serviceCenters.name,
        technicianName: assignedTech.name,
        reason: requestAssignments.reason,
        byName: assignedBy.name,
        createdAt: requestAssignments.createdAt,
      })
      .from(requestAssignments)
      .innerJoin(serviceCenters, eq(requestAssignments.serviceCenterId, serviceCenters.id))
      .innerJoin(assignedBy, eq(requestAssignments.assignedBy, assignedBy.id))
      .leftJoin(assignedTech, eq(requestAssignments.technicianId, assignedTech.id))
      .where(eq(requestAssignments.serviceRequestId, request.id))
      .orderBy(asc(requestAssignments.createdAt)),
    serviceRecordsFor(eq(serviceRecords.serviceRequestId, request.id)),
  ]);

  const r = row!;
  const lastRejection = [...assignmentRows].reverse().find((a) => a.event === 'rejected' && a.serviceCenterId === request.serviceCenterId);
  const detail: ServiceRequestDetail = {
    id: request.id,
    type: request.type,
    status: request.status,
    description: request.description,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    asset: { ...r.asset, warranties: warrantyRows },
    home: r.home,
    customer: r.customer,
    center: r.center,
    technician: r.technicianId ? { id: r.technicianId, name: r.technicianName!, phone: r.technicianPhone } : null,
    schedule: r.scheduleId ? { id: r.scheduleId, title: r.scheduleTitle! } : null,
    rejectionReason: request.status === 'rejected' ? (lastRejection?.reason ?? null) : null,
    rejectedByCenterIds: [...new Set(assignmentRows.filter((a) => a.event === 'rejected').map((a) => a.serviceCenterId))],
    visits: visitRows.map((v) => ({
      id: v.id,
      proposedAt: v.proposedAt.toISOString(),
      status: v.status,
      respondedAt: v.respondedAt?.toISOString() ?? null,
      createdAt: v.createdAt.toISOString(),
    })),
    updates: updateRows.map((u) => ({
      id: u.id,
      fromStatus: u.fromStatus,
      toStatus: u.toStatus,
      note: u.note,
      createdAt: u.createdAt.toISOString(),
      user: { name: u.userName, role: u.userRole },
    })),
    assignments: assignmentRows.map(({ serviceCenterId: _, ...a }) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    record: records[0] ?? null,
  };
  res.json(detail);
});
