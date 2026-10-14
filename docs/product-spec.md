# SET25 Platform Product Specification

## Product intent

SET25 is a premium volleyball performance platform built around one operational source of truth. It has two applications with deliberately different audiences:

- **SET25 HQ** (`apps/hq`, future domain `hq.set25.mv`) is the private operating system for SET25 staff. It surfaces what needs attention, supports privileged workflows, and will eventually manage products, stock, orders, supply, money, tasks, relationships, and content.
- **SET25 Store** (`apps/shop`, future domain `set25.mv`) is the customer-facing commerce experience. It will read only published, customer-safe product and availability data and will create customer-safe commerce records through controlled server-side operations.

Both applications use the same PostgreSQL database, Prisma schema, product catalogue, inventory, orders, customers, and shared business rules. They are separate application boundaries, not separate business systems or databases.

## Milestone 1: HQ foundation

Milestone 1 establishes the visual, technical, and navigational reference for HQ. It includes:

- a branded, responsive application shell;
- desktop sidebar and mobile navigation;
- one polished dashboard focused on action and operational awareness;
- reusable design tokens and foundational interface patterns;
- canonical SET25 SVG asset integration;
- Rajdhani display typography and Inter interface typography;
- loading, empty, and placeholder-route states;
- review of the shared Prisma foundation;
- preparation points for authentication and authorization.

Milestone 1 does **not** implement business workflows or CRUD for orders, inventory, suppliers, imports, finance, preorders, customers, teams, samples, ambassadors, content, ecommerce, or checkout.

## Dashboard purpose

The dashboard answers one question first: **What needs my attention right now?**

It presents:

- sales, profit, orders, and stock value summaries;
- needs-attention items with severity and a clear next destination;
- incoming stock status;
- recent orders;
- upcoming tasks;
- recent operational activity.

Until the relevant models and workflows exist, dashboard values are explicitly marked as demonstration data. The UI must never imply that demo values came from live operations.

## Information architecture

The navigation reserves stable destinations for future work:

- **Overview:** Dashboard
- **Commerce:** Orders, Products, Stock, Preorders, Customers, Teams
- **Supply:** Suppliers, Imports, Samples
- **Company:** Money, Tasks, Ambassadors, Content, Files
- **System:** Settings

Unimplemented destinations render safe, branded empty states. They do not contain premature workflows.

## Product language

HQ uses direct, plain English. Prefer labels such as Money In, Money Out, Profit, Cost Each, Sell Price, Stock, Incoming, Amount Paid, Balance Left, Shipping Cost, Product Cost, Low Stock, Needs Attention, Cost of Items Sold, and Actual Cost to SET25.

## Access and security direction

HQ is private by design. A later authentication milestone will establish staff identity, session handling, and role-based authorization at server boundaries. UI visibility is not authorization. Every privileged read or mutation must eventually be protected on the server.

The Store must never import or expose HQ route handlers or privileged operations. Shared code belongs in packages only when it is safe and genuinely shared; public DTOs must exclude internal cost, supplier, margin, and operational fields.

## Success criteria for Milestone 1

- The dashboard feels recognizably SET25 rather than like a generic admin template.
- Primary navigation works on desktop and mobile.
- All reserved routes render without errors.
- Canonical brand files are used without redrawing the marks.
- The layout remains clear from small mobile screens through wide desktop displays.
- Loading and empty states are purposeful and accessible.
- Lint, TypeScript, and production builds pass from the workspace root.
