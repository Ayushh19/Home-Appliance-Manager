import type { ReminderItem, ReminderList } from '@ham/shared';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { Router } from 'express';
import { brandName, categoryName } from '../lib/assetNames.js';
import { db } from '../db/client.js';
import { assetCategories, assets, brands, homes, maintenanceSchedules, reminders, warranties } from '../db/schema.js';
import { HttpError } from '../lib/http.js';
import { currentReminderCondition } from '../lib/reminders.js';
import { requireRole } from '../lib/session.js';

export const remindersRouter = Router();
remindersRouter.use(requireRole('customer'));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Current reminders for the signed-in customer: unread first, then soonest due. */
remindersRouter.get('/', async (req, res) => {
  const rows = await db
    .select({
      id: reminders.id,
      type: reminders.type,
      dueDate: reminders.dueDate,
      readAt: reminders.readAt,
      createdAt: reminders.createdAt,
      assetId: assets.id,
      category: categoryName,
      brand: brandName,
      name: assets.name,
      model: assets.model,
      homeName: homes.name,
      scheduleTitle: maintenanceSchedules.title,
      warrantyDetails: warranties.details,
    })
    .from(reminders)
    .innerJoin(assets, eq(reminders.assetId, assets.id))
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .innerJoin(brands, eq(assets.brandId, brands.id))
    .leftJoin(warranties, eq(reminders.warrantyId, warranties.id))
    .leftJoin(maintenanceSchedules, eq(reminders.maintenanceScheduleId, maintenanceSchedules.id))
    .where(and(eq(reminders.userId, req.user!.id), currentReminderCondition))
    .orderBy(desc(isNull(reminders.readAt)), asc(reminders.dueDate));

  const items: ReminderItem[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    dueDate: r.dueDate,
    read: r.readAt !== null,
    createdAt: r.createdAt.toISOString(),
    asset: { id: r.assetId, name: r.name, category: r.category, brand: r.brand, model: r.model, homeName: r.homeName },
    scheduleTitle: r.type === 'maintenance_due' ? r.scheduleTitle : null,
    warrantyDetails: r.type === 'warranty_expiry' ? r.warrantyDetails : null,
  }));
  const body: ReminderList = { items, unreadCount: items.filter((i) => !i.read).length };
  res.json(body);
});

remindersRouter.post('/read-all', async (req, res) => {
  await db
    .update(reminders)
    .set({ readAt: new Date() })
    .where(and(eq(reminders.userId, req.user!.id), isNull(reminders.readAt)));
  res.status(204).end();
});

remindersRouter.post('/:reminderId/read', async (req, res) => {
  if (!UUID.test(req.params.reminderId)) throw new HttpError(404, 'Reminder not found.');
  const updated = await db
    .update(reminders)
    .set({ readAt: new Date() })
    .where(and(eq(reminders.id, req.params.reminderId), eq(reminders.userId, req.user!.id), isNull(reminders.readAt)))
    .returning({ id: reminders.id });
  if (!updated.length) {
    const [exists] = await db
      .select({ id: reminders.id })
      .from(reminders)
      .where(and(eq(reminders.id, req.params.reminderId), eq(reminders.userId, req.user!.id)));
    if (!exists) throw new HttpError(404, 'Reminder not found.');
  }
  res.status(204).end();
});
