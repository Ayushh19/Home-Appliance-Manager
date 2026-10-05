import { sql } from 'drizzle-orm';
import { assetCategories, assets, brands } from '../db/schema.js';

// Display names: what the customer typed for "Other", otherwise the built-in name.
// Queries using these must join asset_categories and brands.
export const categoryName = sql<string>`coalesce(${assets.customCategory}, ${assetCategories.name})`;
export const brandName = sql<string>`coalesce(${assets.customBrand}, ${brands.name})`;
