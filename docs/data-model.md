# SET25 Data Model Direction

## Existing foundation

`packages/database` is the single database package for both `apps/hq` and `apps/shop`. It uses Prisma 7.10 with PostgreSQL and the PostgreSQL driver adapter. Prisma configuration is correctly separated into `prisma7.config.ts`; the datasource URL is supplied there rather than in `schema.prisma`, matching Prisma 7 conventions.

The current schema contains:

- `Product`: stable ID, unique internal code, name, optional description, timestamps, and variants;
- `ProductVariant`: stable ID, product relation, optional size/colour, unique SKU, aggregate stock, optional cost, selling price, and timestamps.

This is a valid seed for a shared catalogue, but the integer `stock` field is only a temporary aggregate. It cannot eventually explain where units are, why a balance changed, or which units are reserved or incoming.

Milestone 1 made no schema changes. Milestone 2 evolves this foundation into the shared catalogue and inventory source of truth described below.

## Milestone 2 inventory strategy

SET25 uses a **transactional cached balance plus an append-only movement ledger**:

- `ProductVariant.stockOnHand` is the fast balance used by HQ and future Store availability reads.
- `InventoryMovement` records every increase or decrease, including its type, signed quantity, required reason, optional reference, future staff identity, and idempotency key.
- Application code never exposes a direct stock edit. A stock transaction performs a guarded balance update and movement insert atomically.
- Negative movements use a conditional update requiring enough current stock, preventing concurrent adjustments from taking the balance below zero.
- The unique idempotency key makes repeated form submission safe; a duplicate transaction rolls back its balance update.

This approach avoids summing a potentially large ledger on every stock screen while retaining a complete audit trail. Periodic reconciliation can compare `stockOnHand` with the movement sum later.

## One source of truth

HQ and Store must use this one schema and PostgreSQL database. Application permissions and query projections provide separation:

- HQ may access privileged operational fields through authenticated server-only services.
- Store receives explicit public projections containing only published/customer-safe fields.
- Database access remains server-only; client components never import `@set25/database`.

## Eventual entity map

The following map records implemented foundations and the direction for later milestones.

### Identity and access (implemented foundation)

- `StaffUser` stores a unique normalised email, Argon2id password hash, OWNER / MANAGER / STAFF role, active status, and last successful login.
- Auth.js uses secure JWT session cookies containing the immutable staff ID. Privileged boundaries always reload `StaffUser`, so a stale cookie cannot preserve a removed role or bypass deactivation.
- `InventoryMovement.createdById` is a nullable relation to `StaffUser`; earlier/demo movements remain readable without an actor.
- A general `AuditEvent` remains deferred. Future operations can follow the same nullable actor-relation pattern where appropriate.

### Catalogue (implemented foundation)

- `Product`
- `ProductVariant`
- `ProductMedia` (Milestone 8: public Store images)
- `ProductCollection` / category if merchandising requires it
- publication fields and public descriptions separated from internal notes

### Inventory (implemented foundation)

- `InventoryMovement` as the append-only explanation for quantity changes
- cached `ProductVariant.stockOnHand` balance
- `Location` and per-location balances (later)
- `StockReservation` (Milestone 8: Store checkout holds)
- `StockCount` workflow (later)

The eventual available-to-sell value should be derived from on-hand quantities and reservations. Incoming stock should not count as available stock until received.

### Supply

Milestone 5 implements the supply chain as:

`Supplier → PurchaseOrder → PurchaseOrderLine → ImportShipmentLine → ImportShipment → InventoryMovement → ProductVariant stock`

- `Supplier` is retained by Active/Inactive state. `SupplierProduct` stores lightweight Alibaba/product links, supplier SKU, MOQ, reference prices, currency, and notes against the shared SET25 Product.
- `PurchaseOrder` uses a PostgreSQL sequence-backed number displayed as `PO-000001`. It snapshots one manually entered exchange rate where one unit of PO currency multiplied by the rate equals MVR. `PurchaseOrderLine` snapshots catalogue identity and agreed cost; its optional variant relation uses `SetNull` so history remains readable.
- `ImportShipment` uses `IMP-000001` numbers and may consolidate lines from any number of POs and suppliers. `ImportShipmentLine` is the quantity bridge to a PO line. Active shipment allocation plus already received quantity may never exceed ordered quantity.
- `ImportShipmentEvent` is an append-only, shipment-specific status history with staff identity. Current status remains cached on the shipment for efficient operational queries.
- `Sample` uses `SMP-000001` numbers. Multiple `SampleEvaluation` records retain external tester names, optional recording staff, seven integer scores, and notes. Both runtime validation and a database constraint enforce scores from 1 through 5.
- `PreorderDetail.purchaseOrderId` is an optional, deliberately coarse supply-context link. It does not reserve PO or shipment quantities for a customer.

### Incoming Stock

Incoming per variant is the sum of `quantityOrdered - quantityReceived` on `PLACED` Purchase Orders. Draft, cancelled, and fully received/closed POs do not count. Incoming never changes `stockOnHand` and is never added to Available.

### Actual Cost to SET25

All authoritative calculations use Prisma Decimal:

1. line product cost in MVR = PO unit cost × snapshotted exchange rate × received quantity;
2. shared shipment cost = China Shipping + International Shipping + Tax/Fees + Other Fees;
3. shared cost is allocated either by unit quantity or by each line's share of total MVR product value;
4. actual line cost = product cost + allocated shared cost;
5. actual unit cost = actual line cost ÷ received quantity.

Currency totals and allocated shares are rounded to two decimal places, with the rounding remainder assigned to the final line so allocations equal shared costs exactly. Actual unit cost is retained to four decimal places. If By Product Value is selected while every product value is zero, allocation falls back to quantity rather than losing shared cost.

### Atomic receiving and weighted-average cost

Receiving runs at Serializable isolation and locks the outcome behind shipment state plus deterministic movement keys (`import:{importId}:line:{lineId}:receive`). In one transaction it validates all received quantities, calculates and freezes line costs, increments every variant balance, creates every movement, increments PO received quantities, marks fully received POs closed, marks the shipment received, and appends its event. Any error rolls back everything.

The operational `ProductVariant.cost` becomes a weighted average:

`(existing stock × existing Cost Each + received stock × import Actual Unit Cost) ÷ new stock`

The received import line keeps its own Actual Unit Cost permanently. If existing stock has no known Cost Each, the new received Actual Unit Cost becomes the useful cost for the combined balance rather than treating legacy stock as free.

### Commerce

Milestone 4 implements:

- `Customer`: name and required phone with optional email, Instagram handle, and internal notes.
- `Team`: organisation identity, a deliberately small type enum, and optional contact details. A Team augments rather than replaces the Customer on an Order.
- `Order`: a standard or preorder sale with a PostgreSQL-backed autoincrementing `orderNumber`, source, Decimal totals, fulfilment timestamps, actor, and idempotency key.
- `OrderLine`: an optional variant relation plus immutable product name, code, SKU, size, colour, unit price, unit cost, quantity, and line-total snapshots.
- `Payment`: an append-only PAYMENT / REFUND ledger with positive Decimal amounts, method, optional reference/notes, actor, and unique submission key.
- `PreorderDetail`: a one-to-one extension of Order with required deposit, optional ETA, supplier-ordered signal, notes, and focused status.

The display form `S25-000001` is formatted from the database-assigned integer. It is not generated with `count() + 1`, so concurrent inserts cannot collide.

Payment status is derived from the signed net of the append-only ledger rather than stored as mutable state. A normal payment cannot exceed Balance Left, and a refund cannot exceed the amount currently paid. Serializable payment transactions and unique submission keys prevent concurrent or repeated overpayment.

Orders snapshot all sale facts so catalogue changes cannot rewrite history. The ProductVariant relation uses `SetNull`; historical lines remain readable if a catalogue relationship is removed. No order-line edit or deletion workflow is exposed after creation.

### Order inventory completion

Creating an Order or Preorder does not reserve or deduct stock. Completion runs one database transaction that:

1. verifies the order is active and every line still has a variant;
2. verifies sufficient `stockOnHand` for every line;
3. conditionally decrements every variant without allowing a negative balance;
4. writes one SALE `InventoryMovement` per line with the acting staff member and a unique `order:{orderId}:line:{lineId}:completion` key;
5. records `inventoryAppliedAt` and moves the order to COMPLETED;
6. moves an attached preorder detail to COMPLETED.

Any failure rolls back all line deductions and movements. Repeated or concurrent completion cannot apply inventory twice. Completed orders cannot be moved backwards or directly cancelled; returns are intentionally deferred.

### Commerce query indexes

Indexes support the current operational queries: order date, fulfilment/date, type/date, customer/date, team/date, line variant, payment order/date, and preorder status/ETA. Customer name, phone, and email plus Team name/type support their current directory filters without adding speculative indexes.

### Money

- `Payment` remains the only source for actual customer Order/Preorder payments and refunds. These transactions are aggregated directly into Money In and are never copied into `MoneyEntry`.
- `MoneyEntry` is an append-only ledger for manual Money In and actual Money Out. It records direction, a deliberately small category, positive Decimal amount, MVR currency, occurrence date, description, optional reference/notes, actor, and a unique submission key.
- A MoneyEntry may link to at most one Supplier, Purchase Order, Import Shipment, or Order. Explicit nullable foreign keys provide referential integrity; a database check prevents multiple simultaneous links.
- Runtime and database checks restrict Money In to Owner Funding, Other Income, and Refund Received, and Money Out to the supported payment/operating categories.
- `amount` is always MVR and is the only value used in totals. An entry paid in USD also stores `originalCurrency`, `originalAmount`, and the manually entered `exchangeRateToMvr`; the server computes `amount` as original × rate, rounded half-up to two decimals. A database check requires all three original fields together, or none. Money History shows the MVR amount with a currency marker that reveals the original amount. Exchange-rate ledgers and FX gain/loss accounting remain deferred.

Profitability is derived rather than stored. Completed Orders in the period provide Sales Revenue. Their immutable `OrderLine.unitCost × quantity` snapshots provide Cost of Items Sold. Missing historical costs make Sales Profit and Operating Profit unavailable. Operating Expenses include Packaging, Marketing, Delivery, Software, and Other only. Inventory acquisition categories are excluded to prevent double-counting costs already included through Actual Cost to SET25 and Cost of Items Sold. Equipment is excluded pending an explicit future treatment.

Financial naming in the interface remains plain English even where the model uses precise accounting concepts.

### Operations and relationships

- `Task` stores title, optional description, To Do/Doing/Waiting/Done status, Low/Medium/High priority, optional due date, creator, optional active staff assignee, completion timestamp, and timestamps.
- Explicit nullable relations support one Order/Preorder, Purchase Order, Import, Supplier, Sample, Customer, or Team link. A database check enforces at most one linked record and another keeps Done status aligned with `completedAt`.
- Owner and Manager may create, edit, assign, and change task status. Staff may view all Tasks and change only the status of Tasks assigned to themselves; they cannot create, edit, reassign, or reprioritise Tasks. The status action enforces this server-side.

### Ambassadors

- `Ambassador` stores name, optional team/club, position, Instagram handle (without `@`), phone, email, Prospect/Active/Paused/Ended status, optional discount code, discount %, commission %, start/end dates, notes, and creator. Ambassadors are never hard-deleted; Ended is the terminal state.
- `discountCode` is normalised to uppercase and unique, which makes it case-insensitively unique; a database check enforces uppercase. Percentages are `Decimal(5,2)` constrained to 0–100. These are reference terms only: Store redemption and commission payouts are deferred to Milestone 8.
- `AmbassadorProductGrant` is an append-only giveaway record: ambassador, variant, quantity (> 0), given date, notes, creator, unique idempotency key, and a unique link to the `InventoryMovement` it created. It snapshots product name, product code, SKU, size, and colour so history stays readable after catalogue edits. All its relations are `Restrict`.

Giving product runs in one transaction: verify the ambassador is not Ended and the variant is active, conditionally decrement `stockOnHand` only when enough stock exists, create a `GIVEAWAY` movement (`-quantity`, acting staff, ambassador reference, derived idempotency key), then create the grant. A repeated submission with the same key returns without deducting again; a concurrent duplicate loses on the unique key.

### Content

- `ContentItem` stores title, platform (Instagram/TikTok/Both), type (Reel/Post/Carousel/Story/Photo/Other), status, hook, caption, notes, `publishAt`, `postedAt`, `externalUrl`, optional product, optional ambassador, optional owner (responsible staff), and creator (who made the record). Owner and creator are separate on purpose.
- Status is Idea, Creating, Ready, Scheduled, Posted, or Cancelled. Database checks require `publishAt` when Scheduled and keep `postedAt` set exactly when Posted. Server actions set `postedAt` on the first move to Posted and clear it when leaving Posted. Any other transition is allowed; there is no state machine.
- Product and ambassador links use `SetNull`; content is planning data and never publishes anything.

### Files

- `FileAsset` holds metadata for a private object: display-only original name, optional note, generated unique `storageKey`, canonical MIME type, size, status (Pending/Available/Deleted), access level (All Staff / Managers & Owner / Owner Only), retention policy (Permanent / Until date) with `retentionUntil`, creator, `finalizedAt`, `deletedAt`, and `deletedBy`. No storage credentials or public URLs are stored.
- Attachments use explicit nullable foreign keys on `FileAsset` (Product, Customer, Team, Order/Preorder, Supplier, Purchase Order, Import, Sample, Ambassador, Content), with a database check allowing at most one target. A file with no target is a general document. Attachment relations are `Restrict`, so a record with files cannot be silently hard-deleted.
- Database checks: size > 0; Permanent ⇔ no `retentionUntil`; Until date ⇔ `retentionUntil` set; Available ⇒ `finalizedAt` set; Deleted ⇔ `deletedAt` set.
- Expiry is derived from `retentionUntil` (the start of the chosen Maldives date) rather than stored as a separate status, so it can never drift from the date.

### Waitlist (pre-launch)

Migration `20261028120000_waitlist` is additive.

- `WaitlistEntry` stores an optional Instagram handle, optional name, optional phone, source (`INSTAGRAM_DM`/`TIKTOK`/`IN_PERSON`), interested product categories (a `ProductCategory[]`, so interest can be captured before products exist), sizes (`String[]`, limited to `WAITLIST_SIZES` by validation), status, `statusChangedAt`, an Early Bird flag, an optional Early Bird code, notes, and creator.
- Status is New → Contacted → Confirmed → Ordered, with Dropped available from anywhere. Any transition is allowed (a dropped person can come back); `statusChangedAt` updates whenever the status changes.
- The handle is stored lowercase without `@` and is unique, so the same person cannot be added twice; a database check enforces the normalised form. The Early Bird code is uppercase and unique, like ambassador discount codes. A code implies the Early Bird flag.
- A database check requires a handle or a name. Customer contact happens on Instagram; HQ stores no message history and sends nothing.
- Entries are not linked to `Customer` or `Order` yet. When orders open, Ordered is set by hand.

### Store and checkout (Milestone 8)

Migration `20261019120000_store_checkout` is additive and backfills only `Customer.phoneKey`.

- **`StockReservation`**: order, unique order line, variant, positive quantity, `ACTIVE`/`RELEASED`/`CONSUMED` status, optional `expiresAt`, and `releasedAt`/`consumedAt`. The database requires `releasedAt` exactly when RELEASED and `consumedAt` exactly when CONSUMED. One reservation per order line makes duplicate holds impossible.
- **Available to sell** is `stockOnHand − Σ quantity of ACTIVE reservations with no expiry or an expiry in the future`. `packages/database/src/inventory.ts` is the only implementation (`getReservedQuantities`, `availableToSell`, `holdingReservationWhere`, `releaseExpiredReservations`).
- **`Order`** additions: `createdById` is now nullable (Store orders have no staff actor; a check requires an actor or a `publicToken`), unique `publicToken`, `intendedPaymentMethod` (`BANK_TRANSFER`/`CASH_ON_DELIVERY`), and the discount snapshot `discountSource` (`MANUAL`/`AMBASSADOR_CODE`), `discountCode`, `discountPercent` (0–100), and `ambassadorId` (`SetNull`). An ambassador-code discount must carry its code and percentage. HQ orders with a manual discount record `MANUAL`.
- **`OrderDelivery`**: one per order. Snapshots recipient name, phone, email, Instagram, address, island/area, delivery method name, an optional `SetNull` link to the option, and customer notes. The fee is `Order.deliveryFee`. Later Customer or delivery-option edits never change it.
- **`DeliveryOption`**: name, description, non-negative price, active, sort order.
- **`StoreSettings`**: a single row with id `store` (enforced by a check): `storeOpen`, announcement, `reservationHours` (1–168), support phone, WhatsApp, Instagram, bank transfer instructions, delivery instructions, and the last staff editor. Explicit columns rather than key/value pairs.
- **`ProductMedia`**: product (`Restrict`), unique generated `storageKey` in the public media bucket, MIME type, positive size, required alt text, sort order, `isPrimary`, Pending/Available status, creator, `finalizedAt`. Removing an image deletes the public object first and then the row. It is separate from `FileAsset` on purpose.
- **`Customer.phoneKey`**: digits-only matching key (`normalizePhone`), indexed but not unique, because existing data may already contain duplicates.

Checkout locks the affected `ProductVariant` rows with `FOR UPDATE` before reading reservations, so concurrent checkouts and HQ completions for the same variants serialise. Completion still uses the conditional `stockOnHand` decrement and SALE idempotency keys, then marks the order's reservations CONSUMED in the same transaction. Cancellation marks them RELEASED.

## Modelling rules for later milestones

- Use explicit money currency and fixed-precision decimals; never floating point.
- Record lifecycle statuses with timestamps or event history when operational auditability matters.
- Prefer ledger/movement records over unexplained mutable totals.
- Add indexes from actual query patterns and constraints from business invariants.
- Decide deletion and retention rules before adding cascading deletes.
- Keep internal notes, costs, supplier terms, and staff identity out of Store projections.
- Introduce entities only in the milestone that owns their behaviour and validation.

## Database client boundary

`@set25/database` currently validates `DATABASE_URL` at module evaluation and exports a singleton Prisma client. This is appropriate for server runtime use, but application code should import it only from server-only data modules. Future work should add a `server-only` guard at the app/service boundary and avoid importing the client in static/demo screens or client bundles.

Password hashing is exported from the server-only database package through `@set25/database/password`. Password hashes are selected only inside authentication and staff-management server code and are never returned to client components.
