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

## Access and security

HQ is private by design. Auth.js Credentials provides staff-only email/password sign-in with no public registration. Secure session cookies identify a staff record by immutable ID, while server authorization reloads the active database record before access or mutation. Navigation visibility is not authorization: Product, Variant, Stock, and staff-access mutations enforce roles on the server.

Owners have complete HQ and staff-management access. Managers can perform ordinary Product, Stock, and Commerce operations. Staff currently have read access to Dashboard, Products, Stock, Orders, Preorders, Customers, and Teams; write access can be broadened later through the shared authorization helpers. Deactivated staff immediately fail the database-backed request boundary even if an older session cookie remains.

Milestone 4 extends read access for Staff to Orders, Preorders, Customers, and Teams while keeping every commerce mutation restricted to Owners and Managers on the server. Order creators, payment recorders, and inventory sale movements retain the acting staff identity.

The Store must never import or expose HQ route handlers or privileged operations. Shared code belongs in packages only when it is safe and genuinely shared; public DTOs must exclude internal cost, supplier, margin, and operational fields.

## Milestone 4: commerce operations

HQ now records real operational sales through one shared commerce foundation:

- Customers retain practical contact details and order history without introducing CRM automation.
- Teams represent organisations while remaining separate from the individual customer/contact on an order.
- Standard orders and preorders share sequence-backed order numbers, immutable item snapshots, Decimal totals, payments, and fulfilment.
- Payments are append-only transactions. Amount Paid, Balance Left, and payment status are derived from payments less refunds.
- Product prices seed a new order line, but an authorised sale-price override changes only that immutable order snapshot.
- Physical stock changes only when an order is completed. Completion checks every line, deducts every quantity, writes SALE movements, and marks the order completed in one transaction.
- Preorders add deposit, estimated arrival, and preorder status to an ordinary order. They do not reserve or create available stock.

Completed orders cannot return to an earlier fulfilment state or be cancelled. Returns, refund workflows, incoming supply, and profitability reporting remain intentionally deferred so historical commerce facts are not weakened by partial workflows.

## Milestone 5: supply operations

HQ now follows SET25 stock from supplier agreement through physical receipt:

- Suppliers retain contacts and lightweight product/MOQ/price references without becoming a separate catalogue.
- Purchase Orders snapshot the supplier, currency, exchange rate, product identity, variant identity, ordered quantity, and agreed unit cost. Drafts may be edited; placed lines are historical facts.
- Imports consolidate quantities from multiple Purchase Orders and suppliers into one freight movement. Their append-only status events show what changed, when, and which staff member changed it.
- Incoming is the remaining quantity on **placed** Purchase Orders only. It is visible operational context, never available stock.
- Shared China shipping, international shipping, tax/fees, and other costs produce a transparent **Actual Cost to SET25** preview before receiving.
- Receiving atomically finalises import costs, increases stock, records `PURCHASE_RECEIVED` movements, updates PO receipts, closes fully received POs, and updates the current weighted-average variant cost.
- Samples support multiple named testers and focused 1–5 evaluation criteria. Approval remains independent from catalogue publication and inventory.
- A preorder can reference a Purchase Order and display its current import context without reserving units or promising stock.

Supply costs exist only to value incoming inventory. Milestone 5 does not introduce a general expense ledger, Money In/Out, accounting reports, file storage, or Store exposure. All supplier, cost, shipment, and staff information remains private to HQ.

The dashboard now uses live data for completed sales this month, order count, recent orders, payment attention, stock value, active import shipments, and supply attention. Profit remains explicitly deferred until its accounting definition is implemented; tasks remain visibly labelled as demo content.

## Success criteria for Milestone 1

- The dashboard feels recognizably SET25 rather than like a generic admin template.
- Primary navigation works on desktop and mobile.
- All reserved routes render without errors.
- Canonical brand files are used without redrawing the marks.
- The layout remains clear from small mobile screens through wide desktop displays.
- Loading and empty states are purposeful and accessible.
- Lint, TypeScript, and production builds pass from the workspace root.
