import { z } from 'zod';
import { todayIso } from './dates.js';
import {
  SERVICE_TYPES,
  type AssignmentEvent,
  type RequestStatus,
  type ServiceRecordSource,
  type ServiceType,
  type UserRole,
  type VisitProposalStatus,
} from './enums.js';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalCost = z
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

const optionalScheduleId = z
  .union([z.string().uuid(), z.literal('')])
  .optional()
  .transform((v) => (v ? v : undefined));

// ---------- Inputs ----------

export const createServiceRequestSchema = z.object({
  type: z.enum(SERVICE_TYPES, { message: 'Choose maintenance or repair' }),
  /** Maintenance only: the schedule this service is for (moved forward on completion). */
  maintenanceScheduleId: optionalScheduleId,
  description: z.string().trim().min(1, 'Describe what needs to be done').max(2000),
  serviceCenterId: z.string().uuid('Choose a service center'),
});
export type CreateServiceRequestInput = z.input<typeof createServiceRequestSchema>;

export const resendServiceRequestSchema = z.object({
  serviceCenterId: z.string().uuid('Choose a service center'),
});

export const rejectServiceRequestSchema = z.object({
  reason: z.string().trim().min(1, 'Give a short reason').max(500),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid('Choose a technician'),
});

export const proposeVisitSchema = z.object({
  /** ISO timestamp. */
  proposedAt: z
    .string()
    .datetime({ offset: true, message: 'Choose a date and time' })
    .refine((v) => new Date(v).getTime() > Date.now(), 'Choose a time in the future'),
});

export const respondVisitSchema = z.object({
  response: z.enum(['confirm', 'decline']),
});

export const progressNoteSchema = z.object({
  note: z.string().trim().min(1, 'Write an update').max(2000),
});

export const completeServiceRequestSchema = z.object({
  workDone: z.string().trim().min(1, 'Describe the work done').max(2000),
  partsReplaced: optionalText(1000),
  cost: optionalCost,
});
export type CompleteServiceRequestInput = z.input<typeof completeServiceRequestSchema>;

/** A past service the customer adds by hand (docs/DECISIONS.md #6, #21). */
export const manualServiceRecordSchema = z
  .object({
    type: z.enum(SERVICE_TYPES, { message: 'Choose maintenance or repair' }),
    maintenanceScheduleId: optionalScheduleId,
    serviceDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
      .refine((v) => v <= todayIso(), 'The date cannot be in the future'),
    problem: optionalText(2000),
    workDone: z.string().trim().min(1, 'Describe the work done').max(2000),
    partsReplaced: optionalText(1000),
    cost: optionalCost,
    performedBy: optionalText(200),
  })
  .refine((r) => r.type === 'maintenance' || !r.maintenanceScheduleId, {
    path: ['maintenanceScheduleId'],
    message: 'Only maintenance can be linked to a schedule',
  });
export type ManualServiceRecordInput = z.input<typeof manualServiceRecordSchema>;

// ---------- Outputs ----------

export interface ServiceCenterOption {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface ServiceRequestSummary {
  id: string;
  type: ServiceType;
  status: RequestStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  asset: { id: string; name: string | null; category: string; brand: string; model: string | null };
  customerName: string;
  homeName: string;
  centerName: string;
  technicianName: string | null;
  /** Next confirmed or pending visit, if any. */
  visit: { proposedAt: string; status: VisitProposalStatus } | null;
}

export interface VisitProposal {
  id: string;
  proposedAt: string;
  status: VisitProposalStatus;
  respondedAt: string | null;
  createdAt: string;
}

export interface RequestUpdate {
  id: string;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus | null;
  note: string | null;
  createdAt: string;
  user: { name: string; role: UserRole };
}

export interface RequestAssignment {
  id: string;
  event: AssignmentEvent;
  centerName: string;
  technicianName: string | null;
  reason: string | null;
  byName: string;
  createdAt: string;
}

export interface ServiceRecord {
  id: string;
  source: ServiceRecordSource;
  type: ServiceType;
  serviceRequestId: string | null;
  serviceDate: string;
  problem: string | null;
  workDone: string | null;
  partsReplaced: string | null;
  cost: number | null;
  performedBy: string | null;
  schedule: { id: string; title: string } | null;
}

export interface ServiceRequestDetail {
  id: string;
  type: ServiceType;
  status: RequestStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  asset: {
    id: string;
    name: string | null;
    category: string;
    brand: string;
    model: string | null;
    serialNumber: string | null;
    purchaseDate: string | null;
    warranties: { startDate: string; endDate: string; details: string | null }[];
  };
  home: { name: string; address: string };
  customer: { name: string; email: string; phone: string | null };
  center: { id: string; name: string; address: string; phone: string; email: string };
  technician: { id: string; name: string; phone: string | null } | null;
  schedule: { id: string; title: string } | null;
  /** Reason given by the current center when status is "rejected". */
  rejectionReason: string | null;
  /** Centers that already rejected this request; they can't be chosen again. */
  rejectedByCenterIds: string[];
  visits: VisitProposal[];
  updates: RequestUpdate[];
  assignments: RequestAssignment[];
  record: ServiceRecord | null;
}

// ---------- Labels ----------

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'New',
  accepted: 'Accepted',
  rejected: 'Rejected',
  assigned: 'Technician assigned',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  maintenance: 'Maintenance',
  repair: 'Repair',
};

/** Requests still being worked on (not finished, rejected or cancelled). */
export const OPEN_REQUEST_STATUSES: readonly RequestStatus[] = ['new', 'accepted', 'assigned', 'in_progress'];
