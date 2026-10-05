# Home Appliance Manager

A responsive web app for managing the full lifecycle of the assets in your home: purchase details, warranties, documents, maintenance schedules, reminders, service requests, repair history, costs, and retirement or replacement. Service centers and their technicians receive and complete service requests, and completed work is added to each asset's history automatically.

## Documentation

| Document | Contents |
|---|---|
| [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md) | What the product is and why |
| [docs/ROLES_AND_PERMISSIONS.md](docs/ROLES_AND_PERMISSIONS.md) | Customer, service center staff, technician |
| [docs/ASSET_LIFECYCLE.md](docs/ASSET_LIFECYCLE.md) | The 16-step asset lifecycle, history and costs |
| [docs/SERVICE_REQUEST_FLOW.md](docs/SERVICE_REQUEST_FLOW.md) | Request statuses, visit scheduling, completion |
| [docs/REMINDERS.md](docs/REMINDERS.md) | Warranty and maintenance reminders |
| [docs/DASHBOARD.md](docs/DASHBOARD.md) | Customer overview page (per home) |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Database tables (draft) |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | Technology choices |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual design reference (neumorphism) |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decision log |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Questions that still need an answer |

## Project structure

```
client/   React + TypeScript (Vite, Tailwind, React Router, TanStack Query)
server/   Node + TypeScript (Express, Drizzle ORM, PGlite)
  src/db/schema.ts   database schema (mirrors docs/DATA_MODEL.md)
  drizzle/           generated SQL migrations
  data/              local PGlite database (git-ignored)
shared/   enums and types shared by client and server
docs/     product and technical decisions
```

## Getting started

Requires Node.js 22+.

```bash
npm install
npm run db:migrate   # create the local database
npm run db:seed      # load the built-in categories and brands
npm run dev          # server on :3001, client on http://localhost:5173
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run server and client with hot reload |
| `npm run typecheck` | Typecheck all packages |
| `npm run build` | Build the client |
| `npm run db:generate` | Generate a migration after changing `server/src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed built-in lists (safe to re-run) |
| `npm run db:reset` | Delete the local database and uploaded files, migrate and seed again |

Database migrations are applied automatically when the server starts.

### Environment variables (all optional)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | API server port |
| `DATA_DIR` | `server/data/pglite` | Database location |
| `UPLOADS_DIR` | `server/uploads` | Uploaded documents |
| `APP_URL` | `http://localhost:5173` | Links in emails |
| `SMTP_URL` | unset (emails printed to console) | Real email sending |
| `MAIL_FROM` | `Home Appliance Manager <no-reply@localhost>` | Email sender |
| `REMINDER_JOB_INTERVAL_MS` | `3600000` (1 hour) | How often the reminder job runs |

The PGlite database allows only one process at a time, so stop `npm run dev` before running `db:migrate`, `db:seed` or `db:reset`.

## Status

Built so far:
- Sign in and sign out for all three roles
- Customer registration
- Service center registration, including the appliance types and brands the center services
- Center staff can create technician accounts
- Homes: add, edit, list
- Assets: add and edit (type, brand, model, serial number, purchase date and price, notes), change status (active / retired / replaced)
- Warranties: add, edit, delete; several per asset
- Documents: upload (PDF/JPG/PNG/WebP, up to 10 MB), view, download, delete
- Maintenance schedules: add, edit, delete; interval in months and next due date; overdue / due-soon badges
- Reminders: warranty ending (30 days) and maintenance due (7 days), shown in-app with an unread badge and emailed. They stop for retired or replaced assets

- Service requests: customer raises a request (maintenance or repair) and picks a matching center; center accepts or rejects and assigns or reassigns a technician; technician proposes visit times, customer confirms; technician starts, posts updates, completes with work done, parts and cost
- Service history: completed requests are added automatically; customers can add past services; total spent per asset; maintenance schedules move forward on completion

- Asset names (optional), "Other" type and brand, and one timeline per asset (purchase, warranties, requests, services, status changes, and what's coming up)
- Center team page: staff add technicians and other staff
- Center page: staff edit the center's details and what it services, and close or reopen the center
- Overview per home: total spent (all time and this year), next service, most-serviced assets, maintenance coming up, warranties ending soon, active requests and recently serviced assets
