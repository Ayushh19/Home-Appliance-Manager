// Enum values shared by the database schema, the API and the UI.
// See docs/DATA_MODEL.md and docs/SERVICE_REQUEST_FLOW.md.

export const USER_ROLES = ['customer', 'center_staff', 'technician'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ASSET_STATUSES = ['active', 'retired', 'replaced'] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const DOCUMENT_TYPES = ['bill', 'warranty_card', 'manual', 'service_document', 'other'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const SERVICE_TYPES = ['maintenance', 'repair'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const REQUEST_STATUSES = [
  'new',
  'accepted',
  'rejected',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Statuses from which the customer may still cancel (before work starts). */
export const CANCELLABLE_STATUSES: readonly RequestStatus[] = ['new', 'accepted', 'assigned'];

export const ASSIGNMENT_EVENTS = [
  'sent_to_center',
  'rejected',
  'technician_assigned',
  'technician_reassigned',
] as const;
export type AssignmentEvent = (typeof ASSIGNMENT_EVENTS)[number];

// withdrawn: voided because the request was reassigned or cancelled before the visit.
export const VISIT_PROPOSAL_STATUSES = ['pending', 'confirmed', 'declined', 'withdrawn'] as const;
export type VisitProposalStatus = (typeof VISIT_PROPOSAL_STATUSES)[number];

export const SERVICE_RECORD_SOURCES = ['request', 'manual'] as const;
export type ServiceRecordSource = (typeof SERVICE_RECORD_SOURCES)[number];

export const REMINDER_TYPES = ['warranty_expiry', 'maintenance_due'] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

/** Reminder lead times in days (docs/REMINDERS.md). */
export const REMINDER_LEAD_DAYS: Record<ReminderType, number> = {
  warranty_expiry: 30,
  maintenance_due: 7,
};

/** Name of the catch-all entry in the built-in category and brand lists (docs/DECISIONS.md #28). */
export const OTHER = 'Other';
