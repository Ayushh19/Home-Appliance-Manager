import type { ServiceRecord, ServiceRequestSummary } from '@ham/shared';
import { asc, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { brandName, categoryName } from './assetNames.js';
import { db } from '../db/client.js';
import {
  assetCategories,
  assets,
  brands,
  homes,
  maintenanceSchedules,
  serviceCenters,
  serviceRecords,
  serviceRequests,
  users,
  visitProposals,
} from '../db/schema.js';

/** Request summaries matching `where`, newest activity first. */
export async function listServiceRequests(where: SQL): Promise<ServiceRequestSummary[]> {
  const customer = alias(users, 'customer');
  const technician = alias(users, 'technician');
  const rows = await db
    .select({
      id: serviceRequests.id,
      type: serviceRequests.type,
      status: serviceRequests.status,
      description: serviceRequests.description,
      createdAt: serviceRequests.createdAt,
      updatedAt: serviceRequests.updatedAt,
      assetId: assets.id,
      category: categoryName,
      brand: brandName,
      name: assets.name,
      model: assets.model,
      customerName: customer.name,
      homeName: homes.name,
      centerName: serviceCenters.name,
      technicianName: technician.name,
    })
    .from(serviceRequests)
    .innerJoin(assets, eq(serviceRequests.assetId, assets.id))
    .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .innerJoin(brands, eq(assets.brandId, brands.id))
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .innerJoin(customer, eq(serviceRequests.customerId, customer.id))
    .innerJoin(serviceCenters, eq(serviceRequests.serviceCenterId, serviceCenters.id))
    .leftJoin(technician, eq(serviceRequests.technicianId, technician.id))
    .where(where)
    .orderBy(desc(serviceRequests.updatedAt));
  if (!rows.length) return [];

  // Open visit (pending or confirmed) per request; at most one exists at a time.
  const visits = await db
    .select({ requestId: visitProposals.serviceRequestId, proposedAt: visitProposals.proposedAt, status: visitProposals.status })
    .from(visitProposals)
    .where(inArray(visitProposals.serviceRequestId, rows.map((r) => r.id)))
    .orderBy(asc(visitProposals.createdAt));
  const openVisit = new Map<string, { proposedAt: string; status: (typeof visits)[number]['status'] }>();
  for (const v of visits) {
    if (v.status === 'pending' || v.status === 'confirmed') openVisit.set(v.requestId, { proposedAt: v.proposedAt.toISOString(), status: v.status });
  }

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    description: r.description,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    asset: { id: r.assetId, name: r.name, category: r.category, brand: r.brand, model: r.model },
    customerName: r.customerName,
    homeName: r.homeName,
    centerName: r.centerName,
    technicianName: r.technicianName,
    visit: openVisit.get(r.id) ?? null,
  }));
}

/** Service records matching `where`, newest service first. */
export async function serviceRecordsFor(where: SQL): Promise<ServiceRecord[]> {
  const rows = await db
    .select({
      id: serviceRecords.id,
      source: serviceRecords.source,
      type: serviceRecords.type,
      serviceRequestId: serviceRecords.serviceRequestId,
      serviceDate: serviceRecords.serviceDate,
      problem: serviceRecords.problem,
      workDone: serviceRecords.workDone,
      partsReplaced: serviceRecords.partsReplaced,
      cost: serviceRecords.cost,
      performedBy: serviceRecords.performedBy,
      scheduleId: maintenanceSchedules.id,
      scheduleTitle: maintenanceSchedules.title,
    })
    .from(serviceRecords)
    .leftJoin(maintenanceSchedules, eq(serviceRecords.maintenanceScheduleId, maintenanceSchedules.id))
    .where(where)
    .orderBy(desc(serviceRecords.serviceDate), desc(serviceRecords.createdAt));
  return rows.map(({ scheduleId, scheduleTitle, ...r }) => ({
    ...r,
    schedule: scheduleId ? { id: scheduleId, title: scheduleTitle! } : null,
  }));
}
