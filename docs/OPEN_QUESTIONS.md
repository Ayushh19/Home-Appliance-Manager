# Open Questions

These need a product decision before they're built. When one is answered, move it to [DECISIONS.md](DECISIONS.md).


## Defaults chosen while building homes and assets (confirm or change)

These weren't specified, so the simplest reasonable behavior was used:

4. **Deleting homes and assets:** neither can be deleted. Assets are retired or replaced instead, per the lifecycle. Homes have no delete option at all.
5. **Fixing mistakes:** warranties and documents can be edited and deleted, to correct entry mistakes.
6. **Undoing a status change:** an asset's status can be changed back to **Active**, for example after retiring it by mistake.
7. **Required asset fields:** only type and brand are required. Model, serial number, purchase date, purchase price and notes are optional.
8. **Uploads:** PDF, JPG, PNG and WebP files only, up to 10 MB each.

## Defaults chosen while building maintenance schedules (confirm or change)

10. **Deleting a schedule:** allowed. Any past or future service linked to it keeps its history; the link to the schedule is just cleared.
11. **Interval unit:** whole months only (1–120), with shortcuts for 3 months, 6 months and every year.
12. **First due date:** defaults to today plus the interval, and the customer can change it.
13. **Retired or replaced assets:** their schedules stay visible. (Reminders for them stop; see decision #26.)

## Defaults chosen while building service requests (confirm or change)

14. **Rejecting:** a center can reject only a **New** request. Once accepted, it can't reject it.
15. **Rescheduling:** a confirmed visit time can't be changed. Neither the technician nor the customer can move it.
16. **Progress updates:** only the technician can add them; staff and the customer can read them.
17. **Cost on completion:** optional, for free work under warranty. The completion date is the day the job is marked completed.
18. **Contact details:** the customer sees the center's and technician's phone numbers. The center and technician see the customer's name, phone, email and home address.
19. **Service records:** records added by hand and records from completed requests can't be edited or deleted.

## Defaults chosen while building the dashboard (confirm or change)

21. **Time windows:** maintenance overdue or due within **30 days**; warranties ending within **30 days**; services from the last **90 days**.
24. **Navigation:** the customer's landing page is now **Overview**; the homes list moved to **Homes**.
