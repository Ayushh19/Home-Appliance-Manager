import { addDays, assetLabel, REMINDER_LEAD_DAYS, todayIso } from '@ham/shared';
import { and, eq, gte, isNull, lte } from 'drizzle-orm';
import { config } from '../config.js';
import { brandName, categoryName } from '../lib/assetNames.js';
import { db } from '../db/client.js';
import { assetCategories, assets, brands, homes, maintenanceSchedules, reminders, users, warranties } from '../db/schema.js';
import { sendEmail } from '../lib/email.js';
import { currentReminderCondition } from '../lib/reminders.js';

// Creates warranty-expiry and maintenance-due reminders (docs/REMINDERS.md) and emails them.
// Safe to run any number of times: a unique index allows one reminder per source per due date,
// and emails go out only for reminders not yet emailed.

/** Creates reminders that have entered their window. Returns how many were created. */
export async function createDueReminders(today = todayIso()): Promise<number> {
  const warrantyRows = await db
    .select({ warrantyId: warranties.id, dueDate: warranties.endDate, assetId: assets.id, userId: homes.ownerId })
    .from(warranties)
    .innerJoin(assets, eq(warranties.assetId, assets.id))
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .where(
      and(
        eq(assets.status, 'active'),
        gte(warranties.endDate, today),
        lte(warranties.endDate, addDays(today, REMINDER_LEAD_DAYS.warranty_expiry)),
      ),
    );

  // Overdue schedules are included, so a schedule added after its due date still gets a reminder.
  const scheduleRows = await db
    .select({
      scheduleId: maintenanceSchedules.id,
      dueDate: maintenanceSchedules.nextDueDate,
      assetId: assets.id,
      userId: homes.ownerId,
    })
    .from(maintenanceSchedules)
    .innerJoin(assets, eq(maintenanceSchedules.assetId, assets.id))
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .where(
      and(
        eq(assets.status, 'active'),
        lte(maintenanceSchedules.nextDueDate, addDays(today, REMINDER_LEAD_DAYS.maintenance_due)),
      ),
    );

  const values = [
    ...warrantyRows.map((r) => ({ type: 'warranty_expiry' as const, warrantyId: r.warrantyId, dueDate: r.dueDate, assetId: r.assetId, userId: r.userId })),
    ...scheduleRows.map((r) => ({
      type: 'maintenance_due' as const,
      maintenanceScheduleId: r.scheduleId,
      dueDate: r.dueDate,
      assetId: r.assetId,
      userId: r.userId,
    })),
  ];
  if (!values.length) return 0;
  const created = await db.insert(reminders).values(values).onConflictDoNothing().returning({ id: reminders.id });
  return created.length;
}

/** Emails current reminders that have not been emailed yet. Returns how many were sent. */
export async function emailPendingReminders(): Promise<number> {
  const pending = await db
    .select({
      id: reminders.id,
      type: reminders.type,
      dueDate: reminders.dueDate,
      email: users.email,
      name: users.name,
      assetId: assets.id,
      category: categoryName,
      brand: brandName,
      assetName: assets.name,
      model: assets.model,
      homeName: homes.name,
      scheduleTitle: maintenanceSchedules.title,
    })
    .from(reminders)
    .innerJoin(users, eq(reminders.userId, users.id))
    .innerJoin(assets, eq(reminders.assetId, assets.id))
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .innerJoin(brands, eq(assets.brandId, brands.id))
    .leftJoin(warranties, eq(reminders.warrantyId, warranties.id))
    .leftJoin(maintenanceSchedules, eq(reminders.maintenanceScheduleId, maintenanceSchedules.id))
    .where(and(isNull(reminders.emailedAt), currentReminderCondition));

  let sent = 0;
  for (const r of pending) {
    const label = assetLabel({ name: r.assetName, brand: r.brand, category: r.category });
    const assetName = `${label}${r.model ? ` (${r.model})` : ''}`;
    const due = formatEmailDate(r.dueDate);
    const subject =
      r.type === 'warranty_expiry'
        ? `Warranty ending soon: ${label}`
        : `Maintenance due: ${r.scheduleTitle} for ${label}`;
    const line =
      r.type === 'warranty_expiry'
        ? `A warranty on your ${assetName} at ${r.homeName} ends on ${due}. If anything is wrong with it, you may be able to get it repaired under warranty before then.`
        : `"${r.scheduleTitle}" for your ${assetName} at ${r.homeName} is due on ${due}.`;
    try {
      await sendEmail({
        to: r.email,
        subject,
        text: `Hi ${r.name},\n\n${line}\n\nView the asset: ${config.appUrl}/app/assets/${r.assetId}\n`,
      });
      await db.update(reminders).set({ emailedAt: new Date() }).where(eq(reminders.id, r.id));
      sent++;
    } catch (err) {
      // Left un-emailed; the next run retries.
      console.error(`[reminders] email failed for reminder ${r.id}:`, err);
    }
  }
  return sent;
}

function formatEmailDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));
}

let running = false;
let rerunRequested = false;

/** Runs the job; if a run is already in progress, one more run follows it (so emails never go out twice). */
export async function runReminderJob(): Promise<void> {
  if (running) {
    rerunRequested = true;
    return;
  }
  running = true;
  try {
    do {
      rerunRequested = false;
      try {
        const created = await createDueReminders();
        const emailed = await emailPendingReminders();
        if (created || emailed) console.log(`[reminders] created ${created}, emailed ${emailed}`);
      } catch (err) {
        console.error('[reminders] job failed:', err);
      }
    } while (rerunRequested);
  } finally {
    running = false;
  }
}

/**
 * Called after an asset, warranty or schedule changes: creates any newly due reminder before the
 * response is sent (so the UI sees it right away), then emails in the background.
 */
export async function refreshReminders(): Promise<void> {
  try {
    await createDueReminders();
  } catch (err) {
    console.error('[reminders] refresh failed:', err);
  }
  void runReminderJob();
}

export function startReminderJob(): void {
  void runReminderJob();
  setInterval(() => void runReminderJob(), config.reminderJobIntervalMs).unref();
}
