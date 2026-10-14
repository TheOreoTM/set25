# SET25 Data Model Direction

## Existing foundation

`packages/database` is the single database package for both `apps/hq` and `apps/shop`. It uses Prisma 7.10 with PostgreSQL and the PostgreSQL driver adapter. Prisma configuration is correctly separated into `prisma7.config.ts`; the datasource URL is supplied there rather than in `schema.prisma`, matching Prisma 7 conventions.

The current schema contains:

- `Product`: stable ID, unique internal code, name, optional description, timestamps, and variants;
- `ProductVariant`: stable ID, product relation, optional size/colour, unique SKU, aggregate stock, optional cost, selling price, and timestamps.

This is a valid seed for a shared catalogue, but the integer `stock` field is only a temporary aggregate. It cannot eventually explain where units are, why a balance changed, or which units are reserved or incoming.

No schema changes are required for Milestone 1. The dashboard uses labelled demonstration data and does not force premature entities into the database.

## One source of truth

HQ and Store must use this one schema and PostgreSQL database. Application permissions and query projections provide separation:

- HQ may access privileged operational fields through authenticated server-only services.
- Store receives explicit public projections containing only published/customer-safe fields.
- Database access remains server-only; client components never import `@set25/database`.

## Eventual entity map

The following is a direction for later milestones, not a Milestone 1 implementation.

### Identity and access

- `StaffUser`
- `Role` / permissions (or a deliberately small role enum initially)
- `Session` / auth-provider account records as required by the chosen auth system
- `AuditEvent`

### Catalogue

- `Product`
- `ProductVariant`
- `ProductMedia`
- `ProductCollection` / category if merchandising requires it
- publication fields and public descriptions separated from internal notes

### Inventory

- `Location` (for example Maldives stock, China warehouse)
- `InventoryBalance`
- `StockMovement` as the append-only explanation for quantity changes
- `StockReservation`
- `StockCount` / adjustment record

The eventual available-to-sell value should be derived from on-hand quantities and reservations. Incoming stock should not count as available stock until received.

### Supply

- `Supplier`
- `PurchaseOrder` and `PurchaseOrderLine`
- `ImportShipment` and shipment events/status
- `Sample` and sample status/history
- supplier and freight costs required to calculate **Actual Cost to SET25**

### Commerce

- `Customer`
- `Team` and membership/contact relationships
- `Order` and immutable `OrderLine` snapshots
- `Payment`
- `Fulfilment` / shipment
- `Preorder` or preorder allocation records where behaviour differs from ordinary orders

Orders should snapshot product naming, SKU, price, discount, and tax/currency facts so history does not change when catalogue records change.

### Money

- `MoneyEntry` or purpose-specific income/expense records
- payment allocation and reconciliation records
- currency and exchange-rate facts where international supply requires them

Financial naming in the interface remains plain English even where the model uses precise accounting concepts.

### Operations and relationships

- `Task`, assignee, due date, status, and links to operational records
- `Ambassador` and agreement/activity records
- `ContentItem` and publishing schedule
- `FileAsset` / attachment metadata with secure object storage references

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
