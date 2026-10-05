import { migrate } from 'drizzle-orm/pglite/migrator';
import { config } from '../config.js';
import { db, pglite } from './client.js';

await migrate(db, { migrationsFolder: config.migrationsDir });
await pglite.close();
console.log('Migrations applied.');
