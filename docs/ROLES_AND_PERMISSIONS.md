# Roles and Permissions

Every user account has exactly **one role**. The app shows a different view for each role.

## Homeowner / Customer

**Account:** signs up on their own.

**Homes**
- Can add homes. Each home has **one owner**; homes can't be shared yet (sharing may come later).

**Assets**
- Can add assets to their homes, with an optional name (e.g. "Bedroom AC"). They pick the type and brand from the built-in list, which includes **Other**; with Other they can type the actual type or brand.
- Can record purchase details: brand, model, purchase date, purchase price, serial number, and notes.
- Can add **one or more warranties** to each asset.
- Can upload documents: bill, warranty card, user manual, service documents, and other files.
- Can set **maintenance schedules**, e.g. every 6 months.
- Can **manually add past services and their costs**, e.g. work done before they joined the app or by someone outside it. A manually added maintenance entry can select a schedule, and that schedule moves forward.
- Can mark an asset as **retired** or **replaced**. Its full history stays available.

**Service requests**
- Can create a service request for an asset. They choose a type (**maintenance** or **repair**), describe the problem, and pick a service center from the registered centers that support the asset's category and brand.
- Can track the request's status.
- Can confirm or decline the visit times the technician proposes.
- Can **cancel** a request before the technician has started work (before **In Progress**).
- If a center rejects the request, they can choose another center **for the same request**.

**Seeing information**
- Sees the dashboard, reminders, each asset's full history, and costs.
- Can only see their own homes, assets and requests.

## Service Center Staff

**Account:** a service center **registers itself**. As part of registration, it chooses the asset categories and brands it supports from the built-in fixed list.

**Accounts**
- A center can have **multiple staff accounts**, all with the same permissions. Any staff member can add more staff.
- Staff **create technician and staff accounts directly** (email and password) on the **Team** page.

**The center** (on the **Center** page)
- Can edit the center's name, address, phone and email, and the appliance types and brands it services. Removing a type or brand only affects new requests (decision #34).
- Can **close** the center: it's hidden from customers choosing a center, and its technicians can't sign in. Staff can still sign in, see past requests, and **reopen** it. Closing is blocked while the center has open requests (new, accepted, assigned or in progress) (decisions #35–#37).

**Service requests**
- Sees the requests that customers have sent to their center, including customer details, asset details, and the problem the customer described.
- Can **accept** a request, or **reject** it with a short reason.
- Can **assign** an accepted request to one of the center's technicians, and **reassign** it to a different one. A basic assignment history is kept.
- Can only see requests sent to their own center.

## Technician

**Account:** belongs to exactly one service center. Center staff create it directly. Can't sign in while the center is closed.

**Service requests**
- Sees the requests assigned to them, with the customer, asset and problem details.
- **Proposes a visit date and time.** If the customer declines, they propose a new time. This repeats until the customer confirms one.
- Can move the request to **In Progress** only after the customer has **confirmed** a visit time.
- Adds progress updates while working.
- Marks the request **Completed** and records the work done, any parts replaced, and the cost. Completion is final, and **the customer does not need to approve it**.
