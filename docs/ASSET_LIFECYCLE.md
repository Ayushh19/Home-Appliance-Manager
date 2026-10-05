# Asset Lifecycle

Every asset moves through this lifecycle:

1. **Home** — the user adds their home or apartment.
2. **Add Asset** — category and brand from the built-in list, model, serial number.
3. **Add Purchase Details** — purchase date, purchase price.
4. **Add Warranty & Documents** — one or more warranties; bill, warranty card, manual, other files.
5. **Set Maintenance Schedule** — e.g. water purifier every 6 months, AC every year.
6. **Receive Reminders** — in-app and email (see [REMINDERS.md](REMINDERS.md)).
7. **Request Service/Maintenance** — customer creates a request (type: maintenance or repair).
8. **Service Center Receives Request** — the center the customer chose.
9. **Service Center Accepts Request** — or rejects with a reason; the customer can pick another center.
10. **Technician Gets Assigned**
11. **Technician Performs Service** — after the customer confirms a visit time.
12. **Service/Repair Gets Recorded** — work done, parts replaced.
13. **Cost Gets Recorded** — linked to that service.
14. **Asset History Gets Updated** — automatically, when the technician marks the request completed.
15. **Future Maintenance/Warranty Reminders** — when a maintenance service is completed (through a request, or added by hand), the selected maintenance schedule's next due date moves forward automatically.
16. **Asset Eventually Gets Replaced or Retired** — all information, documents, expenses and history stay available.

## Asset status

| Status | Meaning |
|---|---|
| `active` | In use (default). |
| `retired` | No longer in use. |
| `replaced` | Replaced by another asset. |

Retired and replaced assets are **never deleted**. Their documents, warranties, service history and costs stay available for reference.

## Asset timeline

The asset page has **one timeline** (docs/DECISIONS.md #30), split into:

- **Coming up**, soonest first: warranty end dates still ahead, and the next due date of each maintenance schedule (including overdue). Only shown for assets in use.
- **History**, newest first:
  - the purchase, with price,
  - each warranty's start date, and its end date once it has passed,
  - each service request raised (problem reported / maintenance requested), with its status if not completed,
  - each service done, with work, parts, who did it and cost; from completed requests or added by hand,
  - each status change (retired, replaced, back in use).

The total spent on service is shown at the top.

## Costs

- Every cost is attached to a **service record**, so the user always knows which service or repair it was for.
- The total spent on an asset is the sum of the costs of all its service records.
- The app only **records** costs. No payments are made through it.
