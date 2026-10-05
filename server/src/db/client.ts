import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { config } from '../config.js';
import * as schema from './schema.js';

mkdirSync(path.dirname(config.dataDir), { recursive: true });
export const pglite = new PGlite(config.dataDir);
export const db = drizzle(pglite, { schema });
export type Db = typeof db;
