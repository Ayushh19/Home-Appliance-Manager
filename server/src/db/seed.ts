import { db, pglite } from './client.js';
import { seedCatalog } from './seedCatalog.js';
import { ASSET_CATEGORIES, BRANDS } from './seed-data.js';

await seedCatalog(db);
await pglite.close();
console.log(`Seeded ${ASSET_CATEGORIES.length} categories and ${BRANDS.length} brands.`);
