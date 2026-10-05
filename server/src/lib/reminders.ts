import { and, eq, or } from 'drizzle-orm';
import { assets, maintenanceSchedules, reminders, warranties } from '../db/schema.js';

/**
 * A reminder is "current" while its asset is active (docs/DECISIONS.md #26) and its source still has the
 * same date — e.g. once maintenance is done and the schedule moves forward, the old reminder drops out.
 * Queries using this must join assets, and left join warranties and maintenance_schedules.
 */
export const currentReminderCondition = and(
  eq(assets.status, 'active'),
  or(
    and(eq(reminders.type, 'warranty_expiry'), eq(warranties.endDate, reminders.dueDate)),
    and(eq(reminders.type, 'maintenance_due'), eq(maintenanceSchedules.nextDueDate, reminders.dueDate)),
  ),
);
