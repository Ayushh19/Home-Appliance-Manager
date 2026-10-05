# Reminders

## Channels

- **In-app:** shown on the customer's dashboard and reminders list.
- **Email:** sent to the customer's email address. During development, emails are logged or caught locally and not actually delivered.

## Reminder types

| Type | When it fires |
|---|---|
| Warranty expiry | **30 days** before a warranty's end date. Each warranty on an asset gets its own reminder. |
| Maintenance due | **7 days** before a maintenance schedule's next due date. |

These timings are fixed. Users can't change them.

Reminders are **not** created for assets that are retired or replaced, and existing ones stop showing.

## Maintenance schedules

- A schedule has a title and an interval, e.g. every 6 months or every 12 months, plus a **next due date**.
- When a **maintenance** service request is completed, the **schedule selected on that request** moves forward **automatically** to the completion date plus the interval.
- The same happens when the customer adds a maintenance service by hand and selects a schedule.

## How reminders are generated

A job inside the server (`server/src/jobs/reminders.ts`) finds warranties and maintenance schedules on **active** assets that have reached their reminder window:

- **Warranty:** the end date is between today and today + 30 days.
- **Maintenance:** the next due date is on or before today + 7 days. This includes overdue schedules, so one added after its due date still gets a reminder.

For each one it creates an in-app reminder and emails it. A unique index allows only one reminder per warranty or schedule per due date, and each reminder is emailed only once, so running the job repeatedly is safe.

The job runs:
- when the server starts,
- every hour (`REMINDER_JOB_INTERVAL_MS`),
- straight after a warranty or schedule is added or edited, or an asset's status changes, so a reminder that is already due shows up immediately.

## Which reminders are shown

The **Reminders** page and the unread count in the navigation show a reminder only while it is **current**:
- its asset is still active, and
- its warranty end date or schedule due date is still the same.

For example, when a schedule's due date moves forward (edited, or after maintenance is done), the old reminder disappears and a new one is created when the new date comes into the window.

Customers can mark one reminder or all reminders as read.

## Email in development

If `SMTP_URL` isn't set, emails are printed to the server console (lines starting with `[email]`) instead of being sent. Set `SMTP_URL` (for example `smtp://user:pass@host:587`) and `MAIL_FROM` to send real emails. Links in emails use `APP_URL` (default `http://localhost:5173`).

## Not included (for now)

- Notifications when a service request changes status.
- Notifications to technicians when a request is assigned to them.
