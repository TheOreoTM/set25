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

HQ is private by design. Auth.js Credentials provides staff-only username/password sign-in with no public registration. Secure session cookies identify a staff record by immutable ID, while server authorization reloads the active database record before access or mutation. Navigation visibility is not authorization: Product, Variant, Stock, and staff-access mutations enforce roles on the server.

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

## Milestone 6: money and planning

HQ now provides an operational cash-movement ledger, deliberately scoped profitability reporting, and lightweight task planning. These are management views for running SET25, not formal accounting statements.

Money definitions are explicit:

- **Money In** is the net of recorded Order/Preorder payments and refunds plus manual Money In entries. Customer payments remain in the existing Payment ledger and are never duplicated into `MoneyEntry`.
- **Money Out** is the total of append-only manual `MoneyEntry` outflows in the selected period. A Purchase Order or Import cost fact does not automatically mean cash was paid.
- **Net Cash Recorded** is Money In minus Money Out. It is not a bank balance, available cash figure, or reconciliation.
- **Sales Revenue** is the total of Orders completed in the selected period.
- **Cost of Items Sold** uses the immutable `OrderLine.unitCost × quantity` snapshots for those completed Orders.
- **Sales Profit** is Sales Revenue minus Cost of Items Sold. If any sold line lacks historical Cost Each, Sales Profit is shown as unavailable rather than assuming zero cost.
- **Operating Expenses** include Packaging, Marketing, Delivery, Software, and Other Money Out. Supplier Payment, China Shipping, International Shipping, and Tax/Fees are excluded because they are capitalised through Actual Cost to SET25 and later Cost of Items Sold. Equipment is also excluded because its treatment is intentionally unresolved.
- **Operating Profit** is Sales Profit minus those Operating Expenses. It is an operational definition, not formal accounting net profit.

Manual entries can be entered in MVR or USD. A USD entry records the dollar amount and the exchange rate used, and all totals use its MVR equivalent. Money History shows MVR with a small USD marker that reveals the dollar amount on hover or tap. Entries are historical and append-only with no casual edit/delete workflow. Money may link to one Supplier, Purchase Order, Import, or Order without changing the linked record's operational cost facts.

Tasks are a small planning layer rather than a project-management system. A Task has a status, priority, optional due date, optional active staff assignee, and at most one explicit link to an Order/Preorder, Purchase Order, Import, Supplier, Sample, Customer, or Team. Owner and Manager can create, edit, assign, and update Tasks. Staff can read Money and Tasks, cannot record Money, and can only change the status of Tasks assigned to themselves (including Mark Done). Task views cover Open, Needs Attention (overdue, due today, or High priority), Overdue, Today, Upcoming, Waiting, Completed, and All.

The dashboard uses live monthly Sales Profit and real open Tasks. Formal bookkeeping, bank reconciliation, double entry, tax reporting, payroll, balance sheets, professional profit-and-loss statements, reversals, and equipment accounting remain deferred.

## Milestone 7: relationships, content, and files

HQ now manages ambassadors, plans social content, and stores private files. These connect to existing records rather than living as separate tools.

### Ambassadors

Ambassadors are the players who represent SET25. Each has a status (Prospect, Active, Paused, Ended), contact details, and optional reference terms: a discount code, discount %, and commission %. The terms are recorded for reference only. Store discount redemption and commission payouts are not built yet.

**Give Product** gives real stock to an ambassador. It deducts stock once, records a Giveaway inventory movement by the acting staff member, and adds an append-only grant to the ambassador's history. The giveaway is blocked if stock is insufficient, the variant is archived, or the relationship has Ended. A double submission cannot deduct twice. Grants cannot be edited or deleted; a correction is a separate stock adjustment.

### Content

Content is a production queue for Instagram and TikTok, not a publishing tool. Items move between Idea, Creating, Ready, Scheduled, and Posted (or Cancelled). The rules:

- Scheduled requires a publish date and time, entered in Maldives time.
- Ready does not require a date.
- Marking Posted records `postedAt` the first time.
- The detail page offers only the status moves that change something (Start creating, Mark ready, Schedule, Mark posted, Unschedule, Cancel, Restore).

The planner groups open content into Overdue, Today, This Week, Upcoming, and Unscheduled, with recent Posted items after them. Content is overdue when its publish time has passed and it is not Posted. A content item may reference one product and one ambassador, and has a responsible owner separate from whoever created the record. Working assets go in Files; `externalUrl` is the final public post link.

### Files

Files are private SET25 HQ documents and assets: supplier paperwork, customs documents, receipts, sample photos, agreements, and content assets.

- **Storage:** private S3-compatible object storage (Cloudflare R2 by default) behind a small adapter (`lib/files/storage.ts`). The bucket is never public, credentials never reach the browser, and object keys are generated (`<prefix>/<fileId>/<uuid>`), never derived from filenames.
- **Upload:** HQ authorises the request (role, MIME allowlist, size, access level, retention, target existence), creates a Pending record, and returns a 10-minute presigned PUT URL. The browser uploads directly to storage, so large files never pass through Next.js or Vercel. HQ then finalises: it inspects the stored object and makes the file Available only if the object exists and its size and type match what was authorised. Otherwise the object is removed. Failed uploads are abandoned and never listed.
- **Allowed types:** PDF, JPEG, PNG, WEBP, DOCX, XLSX, PPTX, CSV, TXT, MP4, and MOV. A file is accepted only when its extension and declared MIME type agree. The maximum size is 100 MB by default (`FILE_MAX_UPLOAD_BYTES`).
- **Download:** `/files/[id]/download` re-checks the session, the current database role, the file status, and retention on every request, then redirects to a 60-second signed URL. Images, PDFs, and video may open inline; everything else downloads. No permanent object URL is ever exposed.
- **Access levels:** All Staff, Managers & Owner, and Owner Only, enforced server-side for metadata, lists, downloads, edits, and deletes. Files a viewer cannot access are not listed and behave as not found.
- **Retention:** Permanent, or Until date. Once the date has passed, the file is marked retention-expired, normal download is blocked, and only the Owner can remove it.
- **Deletion:** HQ removes the object from storage first and only then marks the record Deleted, keeping who deleted it and when for audit. If storage deletion fails, the file stays Available and the user sees an error. Object deletion is idempotent, so retries are safe.

A reusable Files panel appears on Product, Customer, Team, Order/Preorder, Supplier, Purchase Order, Import, Sample, Ambassador, and Content detail pages. `/files` is a small searchable library filtered by access, type, and retention.

### Milestone 7 permissions

| Area        | Owner                                                                                          | Manager                                                                                                                    | Staff                                  |
| ----------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Ambassadors | Full                                                                                           | Full                                                                                                                       | Read-only                              |
| Content     | Full                                                                                           | Full                                                                                                                       | Read-only                              |
| Files       | Upload; see, download, edit, and delete everything, including removing retention-expired files | Upload (All Staff or Managers & Owner); download, edit, and delete those levels until retention ends; no Owner Only access | View and download All Staff files only |

The Store must never query `FileAsset` or expose file metadata; Store projections exclude it.

The dashboard adds overdue content and (for the Owner) retention-expired files to Needs Attention, and content planned for the next seven days to Upcoming.

Deferred deliberately: Store discount redemption, commission calculation and payouts, social posting APIs and automatic publishing, campaign analytics, content calendar drag-and-drop, file versioning, virus scanning, a scheduled cleanup job for abandoned pending uploads, and a generic audit log.

## Milestone 8: public Store and checkout

The public Store (`apps/shop`) sells published SET25 products from the same database HQ operates. HQ and the Store work on the same Product, Variant, Customer, and Order records; there is no separate Store catalogue, inventory, or order system.

### Public/private boundary

- The Store queries only through explicit projections in `apps/shop/src/lib` (`catalog.ts`, `orders.ts`, `settings.ts`). Each `select` lists customer-safe fields. Cost, supplier data, purchase orders, imports, internal notes, staff identity, Money records, FileAssets, SKUs, exact stock quantities, and inventory movements are never selected for public output.
- The Store never imports HQ code. Shared logic lives in packages: `@set25/shared` (client-safe labels, `normalizePhone`, public availability labels) and `@set25/database/inventory` (the available-to-sell helper).
- Money crosses the server/client boundary only as strings.

### Catalogue

A product is public when `isPublished = true`, `status = ACTIVE`, and it has at least one active variant. Only active variants are listed. Price is `sellPriceOverride` when set, otherwise `retailPrice`. `/shop` filters by category and "In stock only". Catalogue copy is cached for about a minute (`use cache`, `cacheLife` 60 s); availability is always read fresh. HQ and the Store are separate deployments, so catalogue edits in HQ reach the Store within about a minute rather than through on-demand revalidation.

### Availability

`availableToSell = stockOnHand − ACTIVE, unexpired StockReservation quantity`, computed only by `@set25/database/inventory`. The Store shows **In Stock**, **Low Stock** (3 or fewer), or **Sold Out**; it never shows exact quantities. HQ `/stock` shows On Hand, Reserved, Available, and Incoming.

### Product media

Store images are `ProductMedia` records stored in a **separate, deliberately public** bucket (`R2_PUBLIC_BUCKET_NAME`, served from `PUBLIC_MEDIA_BASE_URL`). Owners and Managers upload them from the product page (JPG/PNG/WEBP, 10 MB, required alt text), reorder them, choose the cover, and remove them. Private `FileAsset` documents are never made public or reused as Store media. Without the public media settings the Store shows a branded placeholder.

### Cart

The cart is stored in `localStorage` (survives refresh, syncs across tabs) and holds variant IDs, quantities, and display snapshots. The cart and checkout pages ask the server for an authoritative quote; the browser's prices, names, discounts, and totals are never trusted.

### Checkout

Guest checkout only. The customer gives full name, phone, optional email and Instagram, island/area, address, optional delivery notes, a delivery option, a payment method (Bank Transfer or Cash on Delivery), and an optional discount code.

The server action re-derives everything in one transaction:

1. validates the form and the cart (1–20 lines, quantity 1–10);
2. confirms the Store is open and the delivery option is active (fresh reads);
3. locks the variant rows (`SELECT … FOR UPDATE`, sorted IDs) and lazily releases expired reservations for them;
4. reloads every variant, checks product ACTIVE, published, variant active, and enough available-to-sell stock;
5. prices lines, subtotal, ambassador discount, delivery fee, and total server-side;
6. reuses or creates the Customer;
7. creates a STANDARD, ONLINE Order (fulfilment NEW, no staff actor) with immutable OrderLine snapshots, an `OrderDelivery` snapshot, the payment intention, and the discount snapshot;
8. creates one ACTIVE reservation per line, expiring after the configured hours;
9. returns an unguessable public token and redirects to `/order/[token]`.

**Idempotency:** the browser generates one UUID per cart (kept in `sessionStorage`, renewed when the cart changes) and the order stores `store:<uuid>` in the unique `Order.idempotencyKey`. A double click, retry, or refresh returns the existing order; a concurrent duplicate loses on the unique key and also returns the winner.

**Customer matching:** phone numbers are normalised to digits without `00` or the `960` country code (`Customer.phoneKey`). The oldest Customer with the same key is reused, otherwise a Customer is created. An advisory lock prevents two simultaneous first orders creating duplicates. Existing Customer details are never overwritten from the public form, and the Store never reveals whether a phone already exists.

**Payment intention:** `Order.intendedPaymentMethod` records what the customer chose. No Payment row is created at checkout. Orders stay Unpaid until staff record a real Payment in HQ.

**Payment proof upload is deferred.** The confirmation page shows the bank details from Store settings and asks the customer to send the transfer slip with the order number by WhatsApp or Instagram. A public upload path would need its own validation, abuse protection, and lifecycle, which is not justified for launch.

### Reservations

- Checkout reserves stock; `stockOnHand` does not change.
- An unpaid reservation expires after `StoreSettings.reservationHours` (default 24). Expiry is lazy: expired holds stop counting immediately and are marked RELEASED the next time a checkout touches that variant. No background job is needed.
- Recording a payment, or moving fulfilment past New, removes the expiry, so confirmed orders keep their hold until completion or cancellation. An already-expired hold is not revived.
- HQ completion deducts `stockOnHand` and writes SALE movements exactly once (unchanged), then marks the order's reservations CONSUMED in the same transaction.
- HQ cancellation releases ACTIVE reservations in the same transaction.
- HQ manual orders, giveaways, and adjustments keep their existing behaviour and are not blocked by Store reservations. Staff can see Reserved and Available on `/stock`; if on-hand stock falls below what is reserved, completing the online order fails with the existing stock error.

### Ambassador discounts

A code is valid when it matches an ACTIVE ambassador's `discountCode` case-insensitively and the ambassador has a discount percentage above 0 and at most 100. The discount applies to the items subtotal, rounded half-up to two places. The order snapshots `discountSource = AMBASSADOR_CODE`, `discountCode`, `discountPercent`, `discountAmount`, and `ambassadorId`, so later ambassador changes never alter past orders. Commission calculation and payouts remain deferred.

### Order confirmation

`/order/[token]` uses a 256-bit random token (`Order.publicToken`), never the order ID or sequential number. It shows the order number, first name, items, totals, fulfilment status, paid/awaiting payment, payment instructions, the stock hold, and delivery details. It is `noindex`, sent with `Referrer-Policy: no-referrer`, rate-limited, and always rendered fresh.

### Store settings and delivery

HQ `/settings/store` (Owner and Manager) controls Store Open, an announcement, reservation hours, support phone/WhatsApp/Instagram, bank transfer instructions, delivery instructions, and delivery options (name, description, price, active, position). The migration creates the settings row **closed**, and the Malé, Hulhumalé, and Other Maldives options **inactive with price 0**, so staff set real prices before opening. When the Store is closed, customers can browse but checkout shows "Online ordering is temporarily unavailable."

### HQ integration

Online orders appear in `/orders` with Source **Online** and use the existing fulfilment, payment, completion, and cancellation workflow. Order detail adds a Store checkout panel with the recipient, phone, email, Instagram, delivery method and fee, area, address, customer notes, intended payment, discount code and ambassador, and the stock hold state.

### Security

Rate limits are in memory per server instance: checkout 10 per 10 minutes, quotes 120, discount checks 20, and order lookups 60 per IP. They slow abuse without new infrastructure. The Store also sends `nosniff` and `X-Frame-Options: DENY`.

### Communications

`apps/shop/src/lib/messaging.ts` is the confirmation boundary. No email, SMS, or WhatsApp provider is approved, so it does nothing and checkout never depends on it.

### Deferred after Milestone 8

Payment-proof upload, confirmation email/SMS/WhatsApp, online card payments, customer accounts, wishlists, reviews, loyalty, advanced promotions, gift cards, commission payouts, courier APIs, a sitemap, cross-instance rate limiting, on-demand Store revalidation from HQ, and reservation-aware blocking of HQ manual sales.

## Success criteria for Milestone 1

- The dashboard feels recognizably SET25 rather than like a generic admin template.
- Primary navigation works on desktop and mobile.
- All reserved routes render without errors.
- Canonical brand files are used without redrawing the marks.
- The layout remains clear from small mobile screens through wide desktop displays.
- Loading and empty states are purposeful and accessible.
- Lint, TypeScript, and production builds pass from the workspace root.
