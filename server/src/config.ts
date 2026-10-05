import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  port: Number(process.env.PORT ?? 3001),
  dataDir: process.env.DATA_DIR ?? path.join(serverRoot, 'data', 'pglite'),
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(serverRoot, 'uploads'),
  migrationsDir: path.join(serverRoot, 'drizzle'),
  /** Base URL of the web app, used for links in emails. */
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  /** SMTP connection string (smtp://user:pass@host:port). Unset in development: emails are printed to the console. */
  smtpUrl: process.env.SMTP_URL,
  mailFrom: process.env.MAIL_FROM ?? 'Home Appliance Manager <no-reply@localhost>',
  /** How often the reminder job runs. Each run is idempotent. */
  reminderJobIntervalMs: Number(process.env.REMINDER_JOB_INTERVAL_MS ?? 60 * 60 * 1000),
};
