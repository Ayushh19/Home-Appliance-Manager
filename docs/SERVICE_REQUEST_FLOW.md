# Service Request Flow

## Creating a request (customer)

1. The customer opens an asset and chooses **Request service**.
2. They choose a **type**, either `maintenance` or `repair`, and describe the problem. For a maintenance request, they also select **which maintenance schedule** of the asset it is for (if the asset has any).
3. They pick a **service center** from the registered, **open** centers that support this asset's **category and brand**. Closed centers aren't listed.
4. The request is created with status **New** and sent to that center.

## Statuses

```
New ──► Accepted ──► Assigned ──► In Progress ──► Completed
 │         │            │
 │         │            └──► Cancelled (by customer)
 │         └──► Cancelled (by customer)
 ├──► Rejected (by center, with reason) ──► New (customer selects another center)
 └──► Cancelled (by customer)
```

| Status | Set by | Meaning |
|---|---|---|
| `new` | Customer | The request has been created and sent to the chosen center. |
| `accepted` | Center staff | The center has taken the request. |
| `rejected` | Center staff | The center turned it down, with a short reason. The customer can select another center **for the same request**, which sets it back to `new`. |
| `assigned` | Center staff | A technician from the center has been assigned. |
| `in_progress` | Technician | Work has started. Only allowed after the customer **confirms a visit time**. |
| `completed` | Technician | Work is done. **This is final**, and the customer does not need to approve it. |
| `cancelled` | Customer | Allowed only **before** `in_progress`. |

## Assignment and reassignment

- Staff assign an accepted request to one of the center's technicians.
- Staff can **reassign** it to a different technician while it is **Assigned** (before work starts). Once work has started it can't be reassigned; further work is a new request after this one is closed (decision #31). Any pending or confirmed visit time is withdrawn, and the new technician proposes a fresh one.
- A basic **assignment history** is kept, covering every center and technician the request has been with, who assigned it, and when.

## Visit scheduling

1. Once assigned, the technician **proposes a visit date and time**.
2. The customer **confirms** or **declines** it.
3. If the customer declines, the technician proposes a new time. This repeats until the customer confirms one.
4. The technician can move the request to **In Progress** only after a visit time has been confirmed.
5. Only one proposal is open at a time. A confirmed time can't be changed by the technician.
6. Cancelling the request withdraws any open proposal.

## Progress updates

While working, the technician can add progress updates. Every status change and update is stored with who made it and when.

## Completion

When the technician marks the request **Completed**, they record:
- the work done,
- any parts replaced,
- the cost (recorded only; it is not paid through the app).

The completion date is the day it's marked completed, and the record's "done by" is the technician and center name.

At that point the app automatically:
1. **Creates a service record** in the asset's history, linked to the request.
2. If the request type is `maintenance` and a schedule was selected, **moves that schedule's next due date forward**. Other schedules aren't affected.

## Past services added by hand

Customers can add a service record themselves (date, maintenance or repair, problem, work done, parts, cost, who did it). A maintenance record can select a schedule; the schedule's next due date becomes *service date + interval*, but only if that is **later** than the current next due date, so adding an old service never pulls a schedule backwards.

## Notifications

There are **no notifications** for status changes or assignments for now. The customer, staff and technician see the current status in their views. Only warranty and maintenance reminders are sent (see [REMINDERS.md](REMINDERS.md)).

## Who sees what

- **Customer:** their own requests.
- **Center staff:** the requests sent to their center, with the customer, asset and problem details.
- **Technician:** the requests assigned to them, with the customer, asset and problem details.
