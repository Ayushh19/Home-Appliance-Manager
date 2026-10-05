import { assetSchema, homeSchema, type HomeSummary } from '@ham/shared';
import { asc, eq, sql } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db/client.js';
import { assets, homes } from '../db/schema.js';
import { listAssets } from '../lib/assetList.js';
import { parseBody } from '../lib/http.js';
import { ownedHome } from '../lib/ownership.js';
import { requireRole } from '../lib/session.js';
import { assertCatalogIds } from './catalog.js';

export const homesRouter = Router();
homesRouter.use(requireRole('customer'));

homesRouter.get('/', async (req, res) => {
  const rows: HomeSummary[] = await db
    .select({
      id: homes.id,
      name: homes.name,
      address: homes.address,
      activeAssetCount: sql<number>`count(${assets.id}) filter (where ${assets.status} = 'active')`.mapWith(Number),
      inactiveAssetCount: sql<number>`count(${assets.id}) filter (where ${assets.status} <> 'active')`.mapWith(Number),
    })
    .from(homes)
    .leftJoin(assets, eq(assets.homeId, homes.id))
    .where(eq(homes.ownerId, req.user!.id))
    .groupBy(homes.id)
    .orderBy(asc(homes.createdAt));
  res.json(rows);
});

homesRouter.post('/', async (req, res) => {
  const input = parseBody(homeSchema, req.body);
  const [home] = await db
    .insert(homes)
    .values({ ...input, ownerId: req.user!.id })
    .returning({ id: homes.id, name: homes.name, address: homes.address });
  res.status(201).json(home);
});

homesRouter.get('/:homeId', async (req, res) => {
  const home = await ownedHome(req.params.homeId, req.user!.id);
  res.json({ id: home.id, name: home.name, address: home.address });
});

homesRouter.patch('/:homeId', async (req, res) => {
  await ownedHome(req.params.homeId, req.user!.id);
  const input = parseBody(homeSchema, req.body);
  const [home] = await db
    .update(homes)
    .set(input)
    .where(eq(homes.id, req.params.homeId))
    .returning({ id: homes.id, name: homes.name, address: homes.address });
  res.json(home);
});

homesRouter.get('/:homeId/assets', async (req, res) => {
  await ownedHome(req.params.homeId, req.user!.id);
  const rows = await listAssets(eq(assets.homeId, req.params.homeId));
  res.json(rows);
});

homesRouter.post('/:homeId/assets', async (req, res) => {
  await ownedHome(req.params.homeId, req.user!.id);
  const input = parseBody(assetSchema, req.body);
  const { otherCategory, otherBrand } = await assertCatalogIds(input.categoryId, input.brandId);
  const [asset] = await db
    .insert(assets)
    .values({
      ...input,
      customCategory: otherCategory ? input.customCategory : undefined,
      customBrand: otherBrand ? input.customBrand : undefined,
      homeId: req.params.homeId,
    })
    .returning({ id: assets.id });
  res.status(201).json(asset);
});
