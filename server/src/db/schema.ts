// Database schema. Mirrors docs/DATA_MODEL.md — keep the two in sync.
import {
  ASSET_STATUSES,
  ASSIGNMENT_EVENTS,
  DOCUMENT_TYPES,
  REMINDER_TYPES,
  REQUEST_STATUSES,
  SERVICE_RECORD_SOURCES,
  SERVICE_TYPES,
  USER_ROLES,
  VISIT_PROPOSAL_STATUSES,
} from '@ham/shared';
import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------- Enums ----------

export const userRole = pgEnum('user_role', USER_ROLES);
export const assetStatus = pgEnum('asset_status', ASSET_STATUSES);
export const documentType = pgEnum('document_type', DOCUMENT_TYPES);
export const serviceType = pgEnum('service_type', SERVICE_TYPES);
export const requestStatus = pgEnum('request_status', REQUEST_STATUSES);
export const assignmentEvent = pgEnum('assignment_event', ASSIGNMENT_EVENTS);
export const visitProposalStatus = pgEnum('visit_proposal_status', VISIT_PROPOSAL_STATUSES);
export const serviceRecordSource = pgEnum('service_record_source', SERVICE_RECORD_SOURCES);
export const reminderType = pgEnum('reminder_type', REMINDER_TYPES);

// ---------- Shared columns ----------

const id = () => uuid('id').primaryKey().defaultRandom();
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: 'number' });

// ---------- Built-in lists ----------

export const assetCategories = pgTable('asset_categories', {
  id: id(),
  name: text('name').notNull().unique(),
  ...timestamps,
});

export const brands = pgTable('brands', {
  id: id(),
  name: text('name').notNull().unique(),
  ...timestamps,
});

// ---------- Service centers and users ----------

export const serviceCenters = pgTable('service_centers', {
  id: id(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  /** Set while the center is closed (docs/DECISIONS.md #35); null when open. */
  closedAt: timestamp('closed_at', { withTimezone: true }),
  ...timestamps,
});

export const serviceCenterCategories = pgTable(
  'service_center_categories',
  {
    serviceCenterId: uuid('service_center_id')
      .notNull()
      .references(() => serviceCenters.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => assetCategories.id),
  },
  (t) => [primaryKey({ columns: [t.serviceCenterId, t.categoryId] })],
);

export const serviceCenterBrands = pgTable(
  'service_center_brands',
  {
    serviceCenterId: uuid('service_center_id')
      .notNull()
      .references(() => serviceCenters.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
  },
  (t) => [primaryKey({ columns: [t.serviceCenterId, t.brandId] })],
);

export const users = pgTable(
  'users',
  {
    id: id(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    role: userRole('role').notNull(),
    // Set only for center_staff and technician.
    serviceCenterId: uuid('service_center_id').references(() => serviceCenters.id),
    ...timestamps,
  },
  (t) => [index('users_service_center_idx').on(t.serviceCenterId)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

// ---------- Homes and assets ----------

export const homes = pgTable(
  'homes',
  {
    id: id(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    address: text('address').notNull(),
    ...timestamps,
  },
  (t) => [index('homes_owner_idx').on(t.ownerId)],
);

export const assets = pgTable(
  'assets',
  {
    id: id(),
    homeId: uuid('home_id')
      .notNull()
      .references(() => homes.id),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => assetCategories.id),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    /** Optional name the customer gives the asset, e.g. "Bedroom AC". */
    name: text('name'),
    // What the customer typed when they chose "Other" as the type or brand.
    customCategory: text('custom_category'),
    customBrand: text('custom_brand'),
    model: text('model'),
    serialNumber: text('serial_number'),
    purchaseDate: date('purchase_date'),
    purchasePrice: money('purchase_price'),
    status: assetStatus('status').notNull().default('active'),
    statusChangedAt: timestamp('status_changed_at', { withTimezone: true }),
    notes: text('notes'),
    ...timestamps,
  },
  (t) => [index('assets_home_idx').on(t.homeId)],
);

/** Every status change, for the asset's timeline. */
export const assetStatusChanges = pgTable(
  'asset_status_changes',
  {
    id: id(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    fromStatus: assetStatus('from_status').notNull(),
    toStatus: assetStatus('to_status').notNull(),
    changedBy: uuid('changed_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('asset_status_changes_asset_idx').on(t.assetId)],
);

export const warranties = pgTable(
  'warranties',
  {
    id: id(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    details: text('details'),
    ...timestamps,
  },
  (t) => [index('warranties_asset_idx').on(t.assetId), index('warranties_end_date_idx').on(t.endDate)],
);

export const documents = pgTable(
  'documents',
  {
    id: id(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    type: documentType('type').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    // Relative to the uploads directory.
    storagePath: text('storage_path').notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [index('documents_asset_idx').on(t.assetId)],
);

export const maintenanceSchedules = pgTable(
  'maintenance_schedules',
  {
    id: id(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    title: text('title').notNull(),
    intervalMonths: integer('interval_months').notNull(),
    nextDueDate: date('next_due_date').notNull(),
    ...timestamps,
  },
  (t) => [
    index('maintenance_schedules_asset_idx').on(t.assetId),
    index('maintenance_schedules_next_due_idx').on(t.nextDueDate),
  ],
);

// ---------- Service requests ----------

export const serviceRequests = pgTable(
  'service_requests',
  {
    id: id(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id),
    // The center currently handling the request; changes when the customer picks another after a rejection.
    serviceCenterId: uuid('service_center_id')
      .notNull()
      .references(() => serviceCenters.id),
    technicianId: uuid('technician_id').references(() => users.id),
    type: serviceType('type').notNull(),
    // Selected schedule for maintenance requests; moved forward on completion.
    maintenanceScheduleId: uuid('maintenance_schedule_id').references(() => maintenanceSchedules.id, {
      onDelete: 'set null',
    }),
    description: text('description').notNull(),
    status: requestStatus('status').notNull().default('new'),
    ...timestamps,
  },
  (t) => [
    index('service_requests_asset_idx').on(t.assetId),
    index('service_requests_customer_idx').on(t.customerId),
    index('service_requests_center_idx').on(t.serviceCenterId),
    index('service_requests_technician_idx').on(t.technicianId),
  ],
);

export const requestAssignments = pgTable(
  'request_assignments',
  {
    id: id(),
    serviceRequestId: uuid('service_request_id')
      .notNull()
      .references(() => serviceRequests.id),
    serviceCenterId: uuid('service_center_id')
      .notNull()
      .references(() => serviceCenters.id),
    // Null for center-level events (sent_to_center, rejected).
    technicianId: uuid('technician_id').references(() => users.id),
    assignedBy: uuid('assigned_by')
      .notNull()
      .references(() => users.id),
    event: assignmentEvent('event').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('request_assignments_request_idx').on(t.serviceRequestId)],
);

export const visitProposals = pgTable(
  'visit_proposals',
  {
    id: id(),
    serviceRequestId: uuid('service_request_id')
      .notNull()
      .references(() => serviceRequests.id),
    proposedBy: uuid('proposed_by')
      .notNull()
      .references(() => users.id),
    proposedAt: timestamp('proposed_at', { withTimezone: true }).notNull(),
    status: visitProposalStatus('status').notNull().default('pending'),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('visit_proposals_request_idx').on(t.serviceRequestId)],
);

export const requestUpdates = pgTable(
  'request_updates',
  {
    id: id(),
    serviceRequestId: uuid('service_request_id')
      .notNull()
      .references(() => serviceRequests.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    // Both null for a plain progress note.
    fromStatus: requestStatus('from_status'),
    toStatus: requestStatus('to_status'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('request_updates_request_idx').on(t.serviceRequestId)],
);

// ---------- History and costs ----------

export const serviceRecords = pgTable(
  'service_records',
  {
    id: id(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    // Null for entries the customer added by hand.
    serviceRequestId: uuid('service_request_id')
      .unique()
      .references(() => serviceRequests.id),
    source: serviceRecordSource('source').notNull(),
    type: serviceType('type').notNull(),
    maintenanceScheduleId: uuid('maintenance_schedule_id').references(() => maintenanceSchedules.id, {
      onDelete: 'set null',
    }),
    serviceDate: date('service_date').notNull(),
    problem: text('problem'),
    workDone: text('work_done'),
    partsReplaced: text('parts_replaced'),
    cost: money('cost'),
    // Free text for manual entries (e.g. a local repair person).
    performedBy: text('performed_by'),
    ...timestamps,
  },
  (t) => [index('service_records_asset_idx').on(t.assetId)],
);

// ---------- Reminders ----------

export const reminders = pgTable(
  'reminders',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    type: reminderType('type').notNull(),
    // Reminders are removed with the warranty or schedule they came from.
    warrantyId: uuid('warranty_id').references(() => warranties.id, { onDelete: 'cascade' }),
    maintenanceScheduleId: uuid('maintenance_schedule_id').references(() => maintenanceSchedules.id, {
      onDelete: 'cascade',
    }),
    dueDate: date('due_date').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    emailedAt: timestamp('emailed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('reminders_user_idx').on(t.userId),
    // One reminder per source per due date, so the daily job never duplicates.
    uniqueIndex('reminders_warranty_due_uq').on(t.warrantyId, t.dueDate),
    uniqueIndex('reminders_schedule_due_uq').on(t.maintenanceScheduleId, t.dueDate),
  ],
);
