# Tech Stack

## Chosen by the product owner

| Area | Choice |
|---|---|
| Frontend | **React + TypeScript** |
| Backend | **Node.js** (TypeScript) |
| ORM | **Drizzle** |
| Database | **PGlite** (embedded Postgres) |
| Hosting | **None for now.** Local development only. |

## Supporting defaults (proposed, can be changed)

| Area | Choice |
|---|---|
| Repo layout | npm workspaces: `client/`, `server/`, `shared/` |
| Frontend build | Vite |
| Routing / data fetching | React Router, TanStack Query |
| Styling | Tailwind CSS, responsive for desktop and mobile |
| HTTP server | Express |
| Validation | Zod schemas in `shared/`, used by both client and server |
| Auth | Email and password. Passwords hashed with Node's built-in `scrypt`. Database-backed sessions in an httpOnly `sid` cookie (30 days). Role checks via `requireRole()` middleware |
| Icons | Lucide (`lucide-react`) |
| Design | Neumorphic, per [DESIGN.md](DESIGN.md). Tokens live in `client/src/index.css` |
| File storage | Local disk |
| Email | Nodemailer, logged to the console or sent to a local mail catcher in development |
| Scheduled jobs | Reminder job inside the server process: on start, hourly, and after relevant changes |
| Migrations | Applied automatically when the server starts |

## Platform

- A single **responsive web app** for desktop and mobile.
- Separate views for the customer, center staff and technician roles.
- **No native mobile app** for now.
