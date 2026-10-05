import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { assets, documents, homes, maintenanceSchedules, warranties } from '../db/schema.js';
import { HttpError } from './http.js';

// Customers can only reach their own homes and what is inside them.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertId(id: string, label: string) {
  if (!UUID.test(id)) throw new HttpError(404, `${label} not found.`);
}

// Each helper returns 404 (not 403) so ids of other users' records are not revealed.

export async function ownedHome(homeId: string, userId: string) {
  assertId(homeId, 'Home');
  const [home] = await db
    .select()
    .from(homes)
    .where(and(eq(homes.id, homeId), eq(homes.ownerId, userId)));
  if (!home) throw new HttpError(404, 'Home not found.');
  return home;
}

export async function ownedAsset(assetId: string, userId: string) {
  assertId(assetId, 'Asset');
  const [row] = await db
    .select({ asset: assets })
    .from(assets)
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .where(and(eq(assets.id, assetId), eq(homes.ownerId, userId)));
  if (!row) throw new HttpError(404, 'Asset not found.');
  return row.asset;
}

export async function ownedWarranty(warrantyId: string, userId: string) {
  assertId(warrantyId, 'Warranty');
  const [row] = await db
    .select({ warranty: warranties })
    .from(warranties)
    .innerJoin(assets, eq(warranties.assetId, assets.id))
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .where(and(eq(warranties.id, warrantyId), eq(homes.ownerId, userId)));
  if (!row) throw new HttpError(404, 'Warranty not found.');
  return row.warranty;
}

export async function ownedDocument(documentId: string, userId: string) {
  assertId(documentId, 'Document');
  const [row] = await db
    .select({ document: documents })
    .from(documents)
    .innerJoin(assets, eq(documents.assetId, assets.id))
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .where(and(eq(documents.id, documentId), eq(homes.ownerId, userId)));
  if (!row) throw new HttpError(404, 'Document not found.');
  return row.document;
}

export async function ownedSchedule(scheduleId: string, userId: string) {
  assertId(scheduleId, 'Maintenance schedule');
  const [row] = await db
    .select({ schedule: maintenanceSchedules })
    .from(maintenanceSchedules)
    .innerJoin(assets, eq(maintenanceSchedules.assetId, assets.id))
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .where(and(eq(maintenanceSchedules.id, scheduleId), eq(homes.ownerId, userId)));
  if (!row) throw new HttpError(404, 'Maintenance schedule not found.');
  return row.schedule;
}
