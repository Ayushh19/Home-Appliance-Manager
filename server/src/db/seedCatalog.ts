import type { Db } from './client.js';
import { assetCategories, brands } from './schema.js';
import { ASSET_CATEGORIES, BRANDS } from './seed-data.js';

/** Inserts any missing built-in categories and brands. Idempotent. */
export async function seedCatalog(db: Db): Promise<void> {
  await db.insert(assetCategories).values(ASSET_CATEGORIES.map((name) => ({ name }))).onConflictDoNothing();
  await db.insert(brands).values(BRANDS.map((name) => ({ name }))).onConflictDoNothing();
}
