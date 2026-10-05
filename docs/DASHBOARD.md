# Overview (per home)

The customer's landing page (`/app`) is an overview of **one home** (docs/DECISIONS.md #32). With several homes, a selector at the top switches between them. The selection is kept in the URL (`/app?home=<id>`) and remembered in the browser. Each home's page also links to its overview.

## Figures

| Figure | What it counts |
|---|---|
| Spent on service | Service and repair costs only (not purchase prices) on the home's assets in use, plus the amount for the current calendar year. See the toggle below |
| Assets in use | Active assets in the home |
| Open service requests | Same as the Active service requests section |
| Next service | The asset in use whose maintenance is due soonest, however far ahead (or overdue) |

## Sections

| Section | What it shows |
|---|---|
| Attention banner | Overdue maintenance, and requests waiting on the customer (rejected and needing a new center, or a visit time to confirm) |
| Active service requests | New, accepted, assigned and in-progress requests, plus rejected ones waiting for the customer to choose another center. Has a **Request service** button (pick one of this home's appliances, then the usual form) |
| Recently serviced | Services on assets in use from the last **90 days**, newest first, with cost |
| Most serviced | Top 3 assets by number of services (then by amount spent), with total spent on each. See the toggle below |
| Maintenance coming up | Schedules on assets in use that are **overdue** or due in the next **30 days** |
| Warranties ending soon | Warranties on assets in use ending in the next **30 days** |

## Including retired and replaced items

A toggle above the figures, **Include retired and replaced items in costs**, is off by default (docs/DECISIONS.md #33). When on, **Spent on service** and **Most serviced** also count retired and replaced assets, which are marked as such. The other sections always show only assets in use. The setting is remembered in the browser.

API: add `&includeRetired=1`.

The time windows are in `DASHBOARD_WINDOW_DAYS` (`shared/src/dashboard.ts`).

API: `GET /api/dashboard?homeId=<id>` (customers only, own homes only).
