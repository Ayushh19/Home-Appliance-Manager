import { OTHER, type CatalogItem } from '@ham/shared';
import { asc, eq, inArray, sql } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db/client.js';
import { assetCategories, brands } from '../db/schema.js';
import { HttpError } from '../lib/http.js';

// Built-in fixed lists. Public, because service center registration needs them.
export const catalogRouter = Router();

catalogRouter.get('/categories', async (_req, res) => {
  const rows: CatalogItem[] = await db
    .select({ id: assetCategories.id, name: assetCategories.name })
    .from(assetCategories)
    .orderBy(sql`${assetCategories.name} = ${OTHER}`, asc(assetCategories.name));
  res.json(rows);
});

catalogRouter.get('/brands', async (_req, res) => {
  const rows: CatalogItem[] = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands)
    .orderBy(sql`${brands.name} = ${OTHER}`, asc(brands.name));
  res.json(rows);
});

/** Throws a 400 unless both ids are in the built-in lists; returns whether each is "Other". */
export async function assertCatalogIds(categoryId: string, brandId: string): Promise<{ otherCategory: boolean; otherBrand: boolean }> {
  const [[category], [brand]] = await Promise.all([
    db.select({ name: assetCategories.name }).from(assetCategories).where(eq(assetCategories.id, categoryId)),
    db.select({ name: brands.name }).from(brands).where(eq(brands.id, brandId)),
  ]);
  const fieldErrors: Record<string, string> = {};
  if (!category) fieldErrors.categoryId = 'Select a category from the list';
  if (!brand) fieldErrors.brandId = 'Select a brand from the list';
  if (Object.keys(fieldErrors).length) throw new HttpError(400, 'Please fix the highlighted fields.', fieldErrors);
  return { otherCategory: category!.name === OTHER, otherBrand: brand!.name === OTHER };
}

/** De-duplicates the lists and throws a 400 unless every id is in the built-in lists. */
export async function assertCatalogLists(categoryIds: string[], brandIds: string[]) {
  const categories = [...new Set(categoryIds)];
  const brandList = [...new Set(brandIds)];
  const [knownCategories, knownBrands] = await Promise.all([
    db.select({ id: assetCategories.id }).from(assetCategories).where(inArray(assetCategories.id, categories)),
    db.select({ id: brands.id }).from(brands).where(inArray(brands.id, brandList)),
  ]);
  if (knownCategories.length !== categories.length) {
    throw new HttpError(400, 'Unknown category selected.', { categoryIds: 'Unknown category selected' });
  }
  if (knownBrands.length !== brandList.length) {
    throw new HttpError(400, 'Unknown brand selected.', { brandIds: 'Unknown brand selected' });
  }
  return { categoryIds: categories, brandIds: brandList };
}
