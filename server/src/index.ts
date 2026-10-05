import cookieParser from 'cookie-parser';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/pglite/migrator';
import express from 'express';
import { config } from './config.js';
import { db } from './db/client.js';
import { seedCatalog } from './db/seedCatalog.js';
import { errorHandler } from './lib/http.js';
import { loadUser } from './lib/session.js';
import { assetsRouter, documentsRouter, schedulesRouter, warrantiesRouter } from './routes/assets.js';
import { authRouter } from './routes/auth.js';
import { catalogRouter } from './routes/catalog.js';
import { centerRouter } from './routes/center.js';
import { dashboardRouter } from './routes/dashboard.js';
import { remindersRouter } from './routes/reminders.js';
import { serviceCentersRouter, serviceRequestsRouter } from './routes/serviceRequests.js';
import { startReminderJob } from './jobs/reminders.js';
import { homesRouter } from './routes/homes.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(loadUser);

app.get('/api/health', async (_req, res) => {
  await db.execute(sql`select 1`);
  res.json({ ok: true });
});
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/center', centerRouter);
app.use('/api/homes', homesRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/warranties', warrantiesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/maintenance-schedules', schedulesRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/service-requests', serviceRequestsRouter);
app.use('/api/service-centers', serviceCentersRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});
app.use(errorHandler);

// Keep the local database schema and built-in lists up to date on every start.
await migrate(db, { migrationsFolder: config.migrationsDir });
await seedCatalog(db);

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
  startReminderJob();
});
