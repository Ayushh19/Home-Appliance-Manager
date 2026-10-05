import type { AssetSummary } from '@ham/shared';
import { asc, desc, eq, type SQL } from 'drizzle-orm';
import { db } from '../db/client.js';
import { assetCategories, assets, brands, homes } from '../db/schema.js';
import { brandName, categoryName } from './assetNames.js';

/** Asset summaries matching `where`, grouped by home, then by type. */
export function listAssets(where: SQL | undefined): Promise<AssetSummary[]> {
  return db
    .select({
      id: assets.id,
      homeId: assets.homeId,
      homeName: homes.name,
      category: categoryName,
      brand: brandName,
      name: assets.name,
      model: assets.model,
      status: assets.status,
      purchaseDate: assets.purchaseDate,
    })
    .from(assets)
    .innerJoin(homes, eq(assets.homeId, homes.id))
    .innerJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .innerJoin(brands, eq(assets.brandId, brands.id))
    .where(where)
    .orderBy(asc(homes.createdAt), asc(categoryName), desc(assets.createdAt));
}
