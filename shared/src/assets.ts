import { z } from 'zod';
import { todayIso } from './dates.js';
import type { ServiceRecord, ServiceRequestSummary } from './serviceRequests.js';
import { ASSET_STATUSES, DOCUMENT_TYPES, type AssetStatus, type DocumentType } from './enums.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date');

/** Empty strings from form inputs become undefined. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalDate = z
  .union([isoDate, z.literal('')])
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalMoney = z
  .union([z.number(), z.string().trim()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === '') return undefined;
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid amount' });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100;
  });

// ---------- Homes ----------

export const homeSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(120),
  address: z.string().trim().min(1, 'Required').max(500),
});
export type HomeInput = z.infer<typeof homeSchema>;

export interface HomeSummary {
  id: string;
  name: string;
  address: string;
  activeAssetCount: number;
  inactiveAssetCount: number;
}

// ---------- Assets ----------

export const assetSchema = z.object({
  categoryId: z.string().uuid('Select a category'),
  brandId: z.string().uuid('Select a brand'),
  name: optionalText(80),
  /** Only kept when the type is "Other". */
  customCategory: optionalText(80),
  /** Only kept when the brand is "Other". */
  customBrand: optionalText(80),
  model: optionalText(120),
  serialNumber: optionalText(120),
  purchaseDate: optionalDate.refine((v) => !v || v <= todayIso(), 'Purchase date cannot be in the future'),
  purchasePrice: optionalMoney,
  notes: optionalText(2000),
});
export type AssetInput = z.input<typeof assetSchema>;

export const assetStatusSchema = z.object({ status: z.enum(ASSET_STATUSES) });

export interface AssetSummary {
  id: string;
  homeId: string;
  homeName: string;
  name: string | null;
  /** Display names: the customer's text for "Other", else the built-in name. */
  category: string;
  brand: string;
  model: string | null;
  status: AssetStatus;
  purchaseDate: string | null;
}

export interface Warranty {
  id: string;
  startDate: string;
  endDate: string;
  details: string | null;
}

export interface AssetDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface AssetDetail extends AssetSummary {
  home: { id: string; name: string };
  categoryId: string;
  brandId: string;
  customCategory: string | null;
  customBrand: string | null;
  serialNumber: string | null;
  purchasePrice: number | null;
  notes: string | null;
  statusChangedAt: string | null;
  warranties: Warranty[];
  documents: AssetDocument[];
  statusChanges: { fromStatus: AssetStatus; toStatus: AssetStatus; createdAt: string }[];
  maintenanceSchedules: MaintenanceSchedule[];
  serviceRecords: ServiceRecord[];
  serviceRequests: ServiceRequestSummary[];
  /** Sum of all service record costs. */
  totalServiceCost: number;
}

// ---------- Warranties ----------

export const warrantySchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    details: optionalText(1000),
  })
  .refine((w) => w.endDate >= w.startDate, { path: ['endDate'], message: 'End date must be after the start date' });
export type WarrantyInput = z.input<typeof warrantySchema>;

// ---------- Documents ----------

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  bill: 'Purchase bill',
  warranty_card: 'Warranty card',
  manual: 'User manual',
  service_document: 'Service document',
  other: 'Other',
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  active: 'Active',
  retired: 'Retired',
  replaced: 'Replaced',
};

/** Upload limits, enforced by the server and shown in the UI. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;

// ---------- Maintenance schedules ----------

export const maintenanceScheduleSchema = z.object({
  title: z.string().trim().min(1, 'Required').max(120),
  intervalMonths: z.coerce
    .number({ message: 'Enter a number of months' })
    .int('Use whole months')
    .min(1, 'At least 1 month')
    .max(120, 'At most 120 months'),
  nextDueDate: isoDate,
});
export type MaintenanceScheduleInput = z.input<typeof maintenanceScheduleSchema>;

export interface MaintenanceSchedule {
  id: string;
  title: string;
  intervalMonths: number;
  nextDueDate: string;
}

/** How an asset is named in the UI and emails: its own name if given, else "Brand Type". */
export function assetLabel(asset: { name?: string | null; brand: string; category: string }): string {
  return asset.name || `${asset.brand} ${asset.category}`;
}
