import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  assetSchema,
  assetStatusSchema,
  documentTypeSchema,
  maintenanceScheduleSchema,
  manualServiceRecordSchema,
  MAX_DOCUMENT_BYTES,
  warrantySchema,
  type AssetDetail,
} from '@ham/shared';
import { and, asc, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { brandName, categoryName } from '../lib/assetNames.js';
import { db } from '../db/client.js';
import {
  assetCategories,
  assets,
  assetStatusChanges,
  brands,
  documents,
  homes,
  maintenanceSchedules,
  serviceRecords,
  serviceRequests,
  warranties,
} from '../db/schema.js';
import { HttpError, parseBody } from '../lib/http.js';
import { ownedAsset, ownedDocument, ownedSchedule, ownedWarranty } from '../lib/ownership.js';
import { requireRole } from '../lib/session.js';
import { refreshReminders } from '../jobs/reminders.js';
import { listServiceRequests, serviceRecordsFor } from '../lib/serviceRequests.js';
import { assertCatalogIds } from './catalog.js';
import { createServiceRequest, moveScheduleForward } from './serviceRequests.js';

// Customer-only routes for a single asset and its warranties and documents.
// Assets are never deleted (docs/ASSET_LIFECYCLE.md); they are retired or replaced instead.
export const assetsRouter = Router(); // mounted at /api/assets
export const warrantiesRouter = Router(); // mounted at /api/warranties
export const documentsRouter = Router(); // mounted at /api/documents
export const schedulesRouter = Router(); // mounted at /api/maintenance-schedules
for (const router of [assetsRouter, warrantiesRouter, documentsRouter, schedulesRouter]) {
  router.use(requireRole('customer'));
}

const scheduleColumns = {
  id: maintenanceSchedules.id,
  title: maintenanceSchedules.title,
  intervalMonths: maintenanceSchedules.intervalMonths,
  nextDueDate: maintenanceSchedules.nextDueDate,
};

const warrantyColumns = {
  id: warranties.id,
  startDate: warranties.startDate,
  endDate: warranties.endDate,
  details: warranties.details,
};

assetsRouter.get('/:assetId', async (req, res) => {
  await ownedAsset(req.params.assetId, req.user!.id);
  const [row] = await db
    .select({
      id: assets.id,
      homeId: assets.homeId,
      homeName: homes.name,
      categoryId: assets.categoryId,
      category: categoryName,
      brandId: assets.brandId,
      customCategory: assets.customCategory,
      customBrand: assets.customBrand,
      brand: brandName,
      name: assets.name,
      model: assets.model,
      serialNumber: assets.serialNumber,
      purchaseDate: assets.purchaseDate,
      purchasePrice: assets.purchasePrice,
      status: assets.status,
      statusChangedAt: assets.statusChangedAt,
      notes: assets.notes,
    })
    .from(assets)
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .innerJoin(brands, eq(assets.brandId, brands.id))
    .where(eq(assets.id, req.params.assetId));

  const [warrantyRows, documentRows, scheduleRows, recordRows, requestRows, statusRows] = await Promise.all([
    db.select(warrantyColumns).from(warranties).where(eq(warranties.assetId, req.params.assetId)).orderBy(asc(warranties.endDate)),
    db
      .select({
        id: documents.id,
        type: documents.type,
        fileName: documents.fileName,
        sizeBytes: documents.sizeBytes,
        uploadedAt: documents.uploadedAt,
      })
      .from(documents)
      .where(eq(documents.assetId, req.params.assetId))
      .orderBy(desc(documents.uploadedAt)),
    db
      .select(scheduleColumns)
      .from(maintenanceSchedules)
      .where(eq(maintenanceSchedules.assetId, req.params.assetId))
      .orderBy(asc(maintenanceSchedules.nextDueDate)),
    serviceRecordsFor(eq(serviceRecords.assetId, req.params.assetId)),
    listServiceRequests(eq(serviceRequests.assetId, req.params.assetId)),
    db
      .select({ fromStatus: assetStatusChanges.fromStatus, toStatus: assetStatusChanges.toStatus, createdAt: assetStatusChanges.createdAt })
      .from(assetStatusChanges)
      .where(eq(assetStatusChanges.assetId, req.params.assetId))
      .orderBy(asc(assetStatusChanges.createdAt)),
  ]);

  const { homeName, statusChangedAt, ...asset } = row!;
  const detail: AssetDetail = {
    ...asset,
    home: { id: asset.homeId, name: homeName },
    statusChangedAt: statusChangedAt?.toISOString() ?? null,
    warranties: warrantyRows,
    documents: documentRows.map((d) => ({ ...d, uploadedAt: d.uploadedAt.toISOString() })),
    maintenanceSchedules: scheduleRows,
    serviceRecords: recordRows,
    serviceRequests: requestRows,
    statusChanges: statusRows.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
    totalServiceCost: recordRows.reduce((sum, r) => sum + (r.cost ?? 0), 0),
  };
  res.json(detail);
});

assetsRouter.patch('/:assetId', async (req, res) => {
  await ownedAsset(req.params.assetId, req.user!.id);
  const input = parseBody(assetSchema, req.body);
  const { otherCategory, otherBrand } = await assertCatalogIds(input.categoryId, input.brandId);
  // Optional fields left empty in the form are cleared.
  await db
    .update(assets)
    .set({
      categoryId: input.categoryId,
      brandId: input.brandId,
      name: input.name ?? null,
      customCategory: otherCategory ? (input.customCategory ?? null) : null,
      customBrand: otherBrand ? (input.customBrand ?? null) : null,
      model: input.model ?? null,
      serialNumber: input.serialNumber ?? null,
      purchaseDate: input.purchaseDate ?? null,
      purchasePrice: input.purchasePrice ?? null,
      notes: input.notes ?? null,
    })
    .where(eq(assets.id, req.params.assetId));
  res.status(204).end();
});

assetsRouter.put('/:assetId/status', async (req, res) => {
  const asset = await ownedAsset(req.params.assetId, req.user!.id);
  const { status } = parseBody(assetStatusSchema, req.body);
  if (status !== asset.status) {
    await db.transaction(async (tx) => {
      await tx
        .update(assets)
        .set({ status, statusChangedAt: status === 'active' ? null : new Date() })
        .where(eq(assets.id, asset.id));
      await tx.insert(assetStatusChanges).values({ assetId: asset.id, fromStatus: asset.status, toStatus: status, changedBy: req.user!.id });
    });
    await refreshReminders();
  }
  res.status(204).end();
});

// ---------- Warranties ----------

assetsRouter.post('/:assetId/warranties', async (req, res) => {
  await ownedAsset(req.params.assetId, req.user!.id);
  const input = parseBody(warrantySchema, req.body);
  const [warranty] = await db
    .insert(warranties)
    .values({ ...input, assetId: req.params.assetId })
    .returning(warrantyColumns);
  await refreshReminders();
  res.status(201).json(warranty);
});

warrantiesRouter.patch('/:warrantyId', async (req, res) => {
  await ownedWarranty(req.params.warrantyId, req.user!.id);
  const input = parseBody(warrantySchema, req.body);
  const [warranty] = await db
    .update(warranties)
    .set({ ...input, details: input.details ?? null })
    .where(eq(warranties.id, req.params.warrantyId))
    .returning(warrantyColumns);
  await refreshReminders();
  res.json(warranty);
});

warrantiesRouter.delete('/:warrantyId', async (req, res) => {
  await ownedWarranty(req.params.warrantyId, req.user!.id);
  await db.delete(warranties).where(eq(warranties.id, req.params.warrantyId));
  res.status(204).end();
});

// ---------- Maintenance schedules ----------
// The next due date is set by the customer here; completed maintenance moves it forward
// automatically (docs/DECISIONS.md #17, #20, #21) once service records are built.

assetsRouter.post('/:assetId/maintenance-schedules', async (req, res) => {
  await ownedAsset(req.params.assetId, req.user!.id);
  const input = parseBody(maintenanceScheduleSchema, req.body);
  const [schedule] = await db
    .insert(maintenanceSchedules)
    .values({ ...input, assetId: req.params.assetId })
    .returning(scheduleColumns);
  await refreshReminders();
  res.status(201).json(schedule);
});

schedulesRouter.patch('/:scheduleId', async (req, res) => {
  await ownedSchedule(req.params.scheduleId, req.user!.id);
  const input = parseBody(maintenanceScheduleSchema, req.body);
  const [schedule] = await db
    .update(maintenanceSchedules)
    .set(input)
    .where(eq(maintenanceSchedules.id, req.params.scheduleId))
    .returning(scheduleColumns);
  await refreshReminders();
  res.json(schedule);
});

schedulesRouter.delete('/:scheduleId', async (req, res) => {
  await ownedSchedule(req.params.scheduleId, req.user!.id);
  await db.delete(maintenanceSchedules).where(eq(maintenanceSchedules.id, req.params.scheduleId));
  res.status(204).end();
});

// ---------- Service requests and history ----------

assetsRouter.post('/:assetId/service-requests', async (req, res) => {
  res.status(201).json(await createServiceRequest(req.params.assetId, req.user!, req.body));
});

// A past service added by hand (docs/DECISIONS.md #6, #21).
assetsRouter.post('/:assetId/service-records', async (req, res) => {
  await ownedAsset(req.params.assetId, req.user!.id);
  const input = parseBody(manualServiceRecordSchema, req.body);
  if (input.maintenanceScheduleId) {
    const [schedule] = await db
      .select({ id: maintenanceSchedules.id })
      .from(maintenanceSchedules)
      .where(and(eq(maintenanceSchedules.id, input.maintenanceScheduleId), eq(maintenanceSchedules.assetId, req.params.assetId)));
    if (!schedule) throw new HttpError(400, "Choose one of this asset's schedules.", { maintenanceScheduleId: 'Unknown schedule' });
  }
  const record = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(serviceRecords)
      .values({ ...input, assetId: req.params.assetId, source: 'manual' })
      .returning({ id: serviceRecords.id });
    if (input.maintenanceScheduleId) await moveScheduleForward(tx, input.maintenanceScheduleId, input.serviceDate);
    return created!;
  });
  await refreshReminders();
  res.status(201).json(record);
});

// ---------- Documents ----------

const upload = multer({
  dest: path.join(config.uploadsDir, 'tmp'),
  limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 },
});

function receiveFile(req: Parameters<ReturnType<typeof upload.single>>[0], res: Parameters<ReturnType<typeof upload.single>>[1]) {
  return new Promise<void>((resolve, reject) =>
    upload.single('file')(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        reject(new HttpError(413, 'File is too large. The limit is 10 MB.', { file: 'File is too large (max 10 MB)' }));
      } else if (err) reject(err);
      else resolve();
    }),
  );
}

assetsRouter.post('/:assetId/documents', async (req, res) => {
  await ownedAsset(req.params.assetId, req.user!.id);
  await receiveFile(req, res);
  const file = req.file;
  try {
    if (!file) throw new HttpError(400, 'Choose a file to upload.', { file: 'Choose a file' });
    if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      throw new HttpError(400, 'Only PDF, JPG, PNG and WebP files are allowed.', { file: 'Unsupported file type' });
    }
    const type = documentTypeSchema.safeParse(req.body?.type);
    if (!type.success) throw new HttpError(400, 'Choose a document type.', { type: 'Choose a document type' });

    const storagePath = path.join(req.params.assetId, randomUUID());
    await mkdir(path.join(config.uploadsDir, req.params.assetId), { recursive: true });
    await rename(file.path, path.join(config.uploadsDir, storagePath));

    const [document] = await db
      .insert(documents)
      .values({
        assetId: req.params.assetId,
        type: type.data,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath,
      })
      .returning({ id: documents.id });
    res.status(201).json(document);
  } finally {
    if (file) await rm(file.path, { force: true });
  }
});

documentsRouter.get('/:documentId/file', async (req, res) => {
  const document = await ownedDocument(req.params.documentId, req.user!.id);
  // ?download=1 forces a download; otherwise the browser shows it inline (PDFs, images).
  const disposition = req.query.download ? 'attachment' : 'inline';
  res.type(document.mimeType);
  res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(document.fileName)}`);
  res.sendFile(path.join(config.uploadsDir, document.storagePath));
});

documentsRouter.delete('/:documentId', async (req, res) => {
  const document = await ownedDocument(req.params.documentId, req.user!.id);
  await db.delete(documents).where(eq(documents.id, document.id));
  await rm(path.join(config.uploadsDir, document.storagePath), { force: true });
  res.status(204).end();
});
