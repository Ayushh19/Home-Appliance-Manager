# Product Vision

## Summary

A web application that helps people manage everything important they own in their home — ACs, refrigerators, washing machines, TVs, water purifiers, geysers, laptops, and other appliances or assets — across the **entire life** of each asset.

It is not just a place to store appliance information. It is where a person manages an asset from the day they buy it, through warranty, maintenance, repairs, service requests and expenses, until it is eventually replaced or retired.

A **service center side** connects the customer's asset records with the people who actually maintain and repair those assets. Service work done through the app automatically becomes part of the asset's history, so the customer never has to maintain that history manually after a service.

## Core ideas

1. **Home first.** A user adds their home or apartment, then adds the assets inside it.
2. **One complete record per asset.** Brand, model, purchase date, purchase price, serial number, warranties, documents (bill, warranty card, manual, service documents, etc.), maintenance schedules, service and repair history, and costs — all in one place.
3. **Reminders.** The app reminds the user about upcoming maintenance and expiring warranties.
4. **Service requests.** The user can raise a service request for an asset, choose a service center, and track the request until it is completed.
5. **Service center and technician views.** Service centers receive, accept or reject and assign requests; technicians schedule visits, do the work, and record what was done.
6. **History builds itself.** A completed service request automatically becomes an entry in the asset's history, including the work done, parts replaced and cost.
7. **Cost tracking.** Every cost is linked to the service or repair it came from, so the user can see how much they have spent on each asset and where the money went.
8. **Nothing disappears.** Retired or replaced assets keep all their information, documents, expenses and history.
9. **At-a-glance dashboard.** Assets that need maintenance soon, warranties that are about to expire, active service requests, and assets that were serviced recently.

## The three roles

| Role | Purpose |
|---|---|
| **Homeowner / Customer** | Manages homes and assets, documents, warranties and maintenance schedules; receives reminders; raises and tracks service requests; views history and costs. |
| **Service Center Staff** | Receives service requests sent to their center; accepts or rejects them; sees customer, asset and problem details; assigns requests to the center's technicians. |
| **Technician** | Sees requests assigned to them; proposes visit times; works on the request, updates progress, records the work done and costs, and marks it completed. |

See [ROLES_AND_PERMISSIONS.md](ROLES_AND_PERMISSIONS.md) for details.

## Example asset history (AC)

- Purchased in January 2025
- Warranty until January 2027
- First maintenance in July 2025
- Cooling problem reported in December 2025
- Technician visited and repaired it — gas refilled — ₹1,500 paid
- Another service in June 2026 — a part was replaced — ₹2,000 paid

## Related documents

- [ASSET_LIFECYCLE.md](ASSET_LIFECYCLE.md) — the 16-step lifecycle of an asset
- [SERVICE_REQUEST_FLOW.md](SERVICE_REQUEST_FLOW.md) — request statuses, visit scheduling, completion
- [REMINDERS.md](REMINDERS.md) — warranty and maintenance reminders
- [DATA_MODEL.md](DATA_MODEL.md) — database tables
- [TECH_STACK.md](TECH_STACK.md) — technology choices
- [DECISIONS.md](DECISIONS.md) — log of every product and technical decision
- [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) — things that still need a decision

## Guiding rule

Do not add features or make product decisions that are not written down in these documents. If something is unclear or needs a product decision, ask the product owner first and record the answer in [DECISIONS.md](DECISIONS.md).
