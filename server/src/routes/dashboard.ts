import { addDays, DASHBOARD_WINDOW_DAYS, OPEN_REQUEST_STATUSES, todayIso, type Dashboard } from '@ham/shared';
import { and, asc, count, desc, eq, gte, inArray, lte, sql, sum } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db/client.js';
import { assetCategories, assets, brands, homes, maintenanceSchedules, serviceRecords, serviceRequests, warranties } from '../db/schema.js';
import { brandName, categoryName } from '../lib/assetNames.js';
import { HttpError } from '../lib/http.js';
import { ownedHome } from '../lib/ownership.js';
import { listServiceRequests } from '../lib/serviceRequests.js';
import { requireRole } from '../lib/session.js';

// The customer's overview of one home (docs/DECISIONS.md #32). Only assets in use are included,
// except that spending and "most serviced" can include retired/replaced ones (?includeRetired=1).
export const dashboardRouter = Router();
dashboardRouter.use(requireRole('customer'));

const assetColumns = {
  id: assets.id,
  name: assets.name,
  category: categoryName,
  brand: brandName,
  model: assets.model,
  homeName: homes.name,
};

dashboardRouter.get('/', async (req, res) => {
  const homeId = typeof req.query.homeId === 'string' ? req.query.homeId : '';
  if (!homeId) throw new HttpError(400, 'Choose a home.');
  const home = await ownedHome(homeId, req.user!.id);
  const today = todayIso();
  const inHome = eq(assets.homeId, home.id);
  const inUse = and(inHome, eq(assets.status, 'active'));
  const yearStart = `${today.slice(0, 4)}-01-01`;
  // Spending and "most serviced" leave out retired/replaced assets unless asked (docs/DECISIONS.md #33).
  const includeRetired = req.query.includeRetired === '1';
  const forCosts = includeRetired ? inHome : inUse;

  const [
    [assetCount],
    [spending],
    mostServiced,
    [nextService],
    maintenanceDue,
    warrantiesEnding,
    activeRequests,
    recentlyServiced,
  ] = await Promise.all([
    db.select({ n: count() }).from(assets).where(inUse),
    db
      .select({
        total: sum(serviceRecords.cost).mapWith(Number),
        thisYear: sql<number>`sum(${serviceRecords.cost}) filter (where ${serviceRecords.serviceDate} >= ${yearStart})`.mapWith(Number),
      })
      .from(serviceRecords)
      .innerJoin(assets, eq(serviceRecords.assetId, assets.id))
      .where(forCosts),
    db
      .select({
        asset: { ...assetColumns, status: assets.status },
        serviceCount: count(serviceRecords.id),
        spent: sql<number>`coalesce(sum(${serviceRecords.cost}), 0)`.mapWith(Number),
      })
      .from(serviceRecords)
      .innerJoin(assets, eq(serviceRecords.assetId, assets.id))
      .innerJoin(homes, eq(assets.homeId, homes.id))
      .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .innerJoin(brands, eq(assets.brandId, brands.id))
      .where(forCosts)
      .groupBy(assets.id, homes.id, assetCategories.id, brands.id)
      .orderBy(desc(count(serviceRecords.id)), desc(sql`coalesce(sum(${serviceRecords.cost}), 0)`))
      .limit(3),
    db
      .select({
        scheduleId: maintenanceSchedules.id,
        title: maintenanceSchedules.title,
        nextDueDate: maintenanceSchedules.nextDueDate,
        asset: assetColumns,
      })
      .from(maintenanceSchedules)
      .innerJoin(assets, eq(maintenanceSchedules.assetId, assets.id))
      .innerJoin(homes, eq(assets.homeId, homes.id))
      .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .innerJoin(brands, eq(assets.brandId, brands.id))
      .where(inUse)
      .orderBy(asc(maintenanceSchedules.nextDueDate))
      .limit(1),
    db
      .select({
        scheduleId: maintenanceSchedules.id,
        title: maintenanceSchedules.title,
        nextDueDate: maintenanceSchedules.nextDueDate,
        asset: assetColumns,
      })
      .from(maintenanceSchedules)
      .innerJoin(assets, eq(maintenanceSchedules.assetId, assets.id))
      .innerJoin(homes, eq(assets.homeId, homes.id))
      .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .innerJoin(brands, eq(assets.brandId, brands.id))
      .where(and(inUse, lte(maintenanceSchedules.nextDueDate, addDays(today, DASHBOARD_WINDOW_DAYS.maintenance))))
      .orderBy(asc(maintenanceSchedules.nextDueDate)),
    db
      .select({ warrantyId: warranties.id, endDate: warranties.endDate, details: warranties.details, asset: assetColumns })
      .from(warranties)
      .innerJoin(assets, eq(warranties.assetId, assets.id))
      .innerJoin(homes, eq(assets.homeId, homes.id))
      .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .innerJoin(brands, eq(assets.brandId, brands.id))
      .where(and(inUse, gte(warranties.endDate, today), lte(warranties.endDate, addDays(today, DASHBOARD_WINDOW_DAYS.warranty))))
      .orderBy(asc(warranties.endDate)),
    listServiceRequests(
      and(
        eq(serviceRequests.customerId, req.user!.id),
        inArray(
          serviceRequests.assetId,
          db.select({ id: assets.id }).from(assets).where(inHome),
        ),
        inArray(serviceRequests.status, [...OPEN_REQUEST_STATUSES, 'rejected']),
      )!,
    ),
    db
      .select({
        recordId: serviceRecords.id,
        serviceDate: serviceRecords.serviceDate,
        type: serviceRecords.type,
        workDone: serviceRecords.workDone,
        cost: serviceRecords.cost,
        asset: assetColumns,
      })
      .from(serviceRecords)
      .innerJoin(assets, eq(serviceRecords.assetId, assets.id))
      .innerJoin(homes, eq(assets.homeId, homes.id))
      .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .innerJoin(brands, eq(assets.brandId, brands.id))
      .where(and(inUse, gte(serviceRecords.serviceDate, addDays(today, -DASHBOARD_WINDOW_DAYS.recentService))))
      .orderBy(desc(serviceRecords.serviceDate), desc(serviceRecords.createdAt)),
  ]);

  const body: Dashboard = {
    home: { id: home.id, name: home.name, address: home.address },
    activeAssetCount: assetCount!.n,
    totalSpent: spending?.total ?? 0,
    spentThisYear: spending?.thisYear ?? 0,
    mostServiced,
    nextService: nextService ?? null,
    maintenanceDue,
    warrantiesEnding,
    activeRequests,
    recentlyServiced,
  };
  res.json(body);
});
