# Data Model

The tables are defined with Drizzle ORM on PGlite. The schema lives in `server/src/db/schema.ts`. Most tables have an `id` and `created_at` / `updated_at` columns, which aren't repeated below.

## Users and service centers

### `users`
| Field | Notes |
|---|---|
| email | unique |
| password_hash | |
| name | |
| phone | |
| role | `customer` \| `center_staff` \| `technician` |
| service_center_id | set only for `center_staff` and `technician` |

### `sessions`
Login sessions (httpOnly cookie).
| Field | Notes |
|---|---|
| id | random session token |
| user_id | → users |
| expires_at | |

### `service_centers`
| Field | Notes |
|---|---|
| name, address, phone, email | editable by staff |
| closed_at | set while the center is closed; null when open |

### `service_center_categories` / `service_center_brands`
Join tables that record which asset categories and brands a center supports. The values come from the built-in fixed lists.

## Built-in lists

### `asset_categories`
Fixed list, seeded and maintained by the app (AC, refrigerator, washing machine, TV, water purifier, geyser, laptop, …).

### `brands`
Fixed list, seeded and maintained by the app. Users can't add to it. Both lists end with **Other**; when a customer picks it for an asset, they can type the actual brand or type.

## Homes and assets

### `homes`
| Field | Notes |
|---|---|
| owner_id | → users (customer). One owner per home. |
| name | |
| address | |

### `assets`
| Field | Notes |
|---|---|
| home_id | → homes |
| category_id | → asset_categories |
| brand_id | → brands |
| name | optional, e.g. "Bedroom AC" |
| custom_category | text typed when the type is "Other" |
| custom_brand | text typed when the brand is "Other" |
| model | |
| serial_number | |
| purchase_date | |
| purchase_price | |
| status | `active` \| `retired` \| `replaced` |
| status_changed_at | when it was retired or replaced |
| notes | |

### `asset_status_changes`
Every status change, for the asset's timeline.
| Field | Notes |
|---|---|
| asset_id | → assets |
| from_status / to_status | `active` \| `retired` \| `replaced` |
| changed_by | → users |

### `warranties`
An asset can have **many** warranties.
| Field | Notes |
|---|---|
| asset_id | → assets |
| start_date | |
| end_date | |
| details | coverage, provider, etc. |

### `documents`
| Field | Notes |
|---|---|
| asset_id | → assets |
| type | `bill` \| `warranty_card` \| `manual` \| `service_document` \| `other` |
| file_name | original file name |
| mime_type | PDF, JPEG, PNG or WebP |
| size_bytes | max 10 MB |
| storage_path | relative to `server/uploads/` |
| uploaded_at | |

### `maintenance_schedules`
| Field | Notes |
|---|---|
| asset_id | → assets |
| title | |
| interval_months | e.g. 6, 12 |
| next_due_date | moves forward automatically when a maintenance service for **this schedule** is recorded |

## Service requests

### `service_requests`
| Field | Notes |
|---|---|
| asset_id | → assets |
| customer_id | → users |
| service_center_id | → service_centers (chosen by the customer) |
| technician_id | → users (technician), set when assigned |
| type | `maintenance` \| `repair` |
| description | problem described by the customer |
| status | `new` \| `accepted` \| `rejected` \| `assigned` \| `in_progress` \| `completed` \| `cancelled` |
| maintenance_schedule_id | → maintenance_schedules; the selected schedule for maintenance requests |

Rejection reasons are stored per center in `request_assignments`, because a request can be sent to several centers one after another.

### `request_assignments`
A basic history of which center and technician the request has been with.
| Field | Notes |
|---|---|
| service_request_id | → service_requests |
| service_center_id | → service_centers |
| technician_id | → users; null for a center-level entry (sent to the center, or rejected by it) |
| assigned_by | → users |
| event | `sent_to_center` \| `rejected` \| `technician_assigned` \| `technician_reassigned` |
| reason | rejection reason, if any |

### `visit_proposals`
| Field | Notes |
|---|---|
| service_request_id | → service_requests |
| proposed_at | the date and time the technician proposed |
| proposed_by | → users (technician) |
| status | `pending` \| `confirmed` \| `declined` \| `withdrawn` (voided by reassignment or cancellation) |
| responded_at | |

### `request_updates`
A log of status changes and progress notes.
| Field | Notes |
|---|---|
| service_request_id | → service_requests |
| user_id | who made the change |
| from_status / to_status | null for a plain progress note |
| note | |

## History and costs

### `service_records`
The asset's service and repair history. A record is created automatically when a request is completed, or added by hand by the customer.
| Field | Notes |
|---|---|
| asset_id | → assets |
| service_request_id | → service_requests; null if added by hand |
| source | `request` \| `manual` |
| type | `maintenance` \| `repair` |
| service_date | |
| problem | |
| work_done | |
| parts_replaced | |
| cost | recorded only; nothing is paid through the app |
| maintenance_schedule_id | → maintenance_schedules; moved forward for maintenance records |
| performed_by | free text for manual entries |

## Reminders

### `reminders`
| Field | Notes |
|---|---|
| user_id | → users |
| asset_id | → assets |
| type | `warranty_expiry` \| `maintenance_due` |
| warranty_id / maintenance_schedule_id | the source; one of them is set |
| due_date | the expiry date or due date |
| read_at | |
| emailed_at | |
