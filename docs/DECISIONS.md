# Decision Log

Every product and technical decision made so far. Add new decisions here as they are made.

## Product decisions — 2026-10-04

| # | Topic | Decision |
|---|---|---|
| 1 | Choosing a service center | The customer chooses from the **registered** service centers that support the asset's category and brand. |
| 2 | Joining | Service centers **register themselves**, then add their own technicians. |
| 3 | Rejecting a request | A center can reject a request with a short reason. The customer can then choose another center. |
| 4 | Cancelling a request | The customer can cancel before the technician starts the service (before **In Progress**). |
| 5 | Completing a request | The technician marks it completed. The **customer does not approve it**; it goes straight into the asset's history. |
| 6 | Past services | Customers can add past services and costs by hand. |
| 7 | Payments | Costs are **recorded only**. No payments go through the app. |
| 8 | Shared homes | **One owner per home.** Sharing may be added later. |
| 9 | Reminders | **In-app and email.** 30 days before a warranty expires; 7 days before maintenance is due. |
| 10 | Platform | **Responsive web app** for desktop and mobile, with views for each role. No native mobile app for now. |
| 11 | Visit scheduling | The **technician proposes** a date and time and the **customer confirms** it. |
| 12 | Declined visit | If the customer declines, the technician proposes a new time. This repeats until one is confirmed. |
| 13 | Supported brands and categories | Centers pick the brands and asset categories they support from a **fixed list**. |
| 14 | Source of the fixed list | **Built-in** and maintained by the app. Users can't add to it. |
| 15 | Status notifications | **None for now.** No notifications for request status changes or technician assignments. |
| 16 | Warranties | An asset can have **multiple warranties**. |
| 17 | Maintenance roll-forward | When a maintenance service is completed, the schedule's next due date moves forward **automatically**. |
| 18 | Request type | The customer marks each request as **maintenance** or **repair**. |
| 19 | Starting work | The technician can't move a request to **In Progress** until the customer has **confirmed a visit time**. |
| 20 | Which schedule moves forward | A maintenance request is linked to a **selected maintenance schedule**. Only that schedule moves forward when the service is completed. |
| 21 | Manual maintenance entries | A maintenance service added by hand can also select a schedule, and it moves that schedule forward too. |
| 22 | Technician accounts | Service center staff **create technician accounts directly** (email and password). |
| 23 | Staff accounts | A center can have **multiple staff accounts**, all with the same permissions. |
| 24 | Reassigning | Staff can **reassign** a request to another technician. A basic **assignment history** is kept. |
| 25 | After rejection | The customer selects another service center **for the same request**; it doesn't need to be recreated. |
| 26 | Reminders for retired assets | Reminders **stop** once an asset is retired or replaced. |
| 27 | Asset name | Assets have an **optional name** (e.g. "Bedroom AC"), shown wherever the asset appears. |
| 28 | Other brand / type | The built-in lists include **"Other"** for brands and asset types. Customers and service centers can choose it. |
| 29 | Adding staff | A center can have **multiple staff accounts**. Any staff member can add more, the same way technicians are added. |
| 30 | Asset timeline | Each asset has **one simple timeline** of everything that happened to it. |
| 31 | Reassigning after work starts | **Not allowed.** Reassigning is only possible before work starts. Further work becomes a new request after the current one is closed. |
| 32 | Overview per home | The customer's overview is shown **per home**. It includes total spending, the most-serviced appliances, the next appliance due for service, and the existing sections (maintenance coming up, warranties ending, active requests, recently serviced). |
| 33 | Spending on the overview | Spending is **service and repair costs only** (not purchase prices). Retired and replaced assets are **left out by default**; a toggle on the overview adds them in. |
| 34 | Editing a center | Staff can edit the center's **name, address, phone, email**, and the **appliance types and brands** it services. Removing a type or brand only affects new requests; existing ones continue. |
| 35 | Closing a center | Closing **deactivates** the center: it's hidden from customers choosing a center, and all its requests and history stay. Staff can **reopen** it. |
| 36 | Open requests when closing | A center **can't be closed while it has open requests** (new, accepted, assigned or in progress). Staff finish or reject them first. |
| 37 | Accounts of a closed center | **Staff** can still sign in (to see past requests and reopen). **Technicians** can't sign in until the center reopens. |

## Technical decisions — 2026-10-04

| # | Topic | Decision |
|---|---|---|
| T1 | Frontend | React + TypeScript |
| T2 | Backend | Node.js |
| T3 | ORM | Drizzle |
| T4 | Database | PGlite |
| T5 | Hosting | None for now; local development only |

| T6 | Design system | Follow [DESIGN.md](DESIGN.md) (neumorphism). Charcoal text instead of Soft Pink, for readability; see its implementation notes |

The supporting defaults (Vite, Express, Tailwind, etc.) are listed in [TECH_STACK.md](TECH_STACK.md) as proposed defaults.
