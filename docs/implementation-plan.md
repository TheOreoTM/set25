# SET25 Platform Implementation Plan

## Milestone 1 — HQ foundation (complete)

Deliver:

- document product, visual, data, and platform direction;
- integrate canonical brand assets and brand tokens;
- install/configure Rajdhani and Inter through the existing Next.js font system;
- build the responsive HQ shell, desktop sidebar, mobile menu, and page header;
- build one polished, demonstration-data dashboard;
- provide loading UI, empty-state patterns, and non-crashing placeholder routes;
- prepare auth boundaries and document the intended protection model without choosing or implementing a provider;
- keep database access server-only and remove the foundation dashboard’s build-time database dependency;
- add/repair workspace typecheck scripts;
- verify lint, typecheck, and production build.

Exit criteria: all requested Milestone 1 UI and documentation are complete; every reserved navigation route works; root validation commands pass.

## Milestone 2 — Catalogue and stock foundation (complete)

Evolve Product and ProductVariant deliberately. Add publication rules, locations, inventory movements, balances, reservations, stock counts, product management, and mobile-first stock checks. Migrate the temporary aggregate stock field safely.

The current milestone implements the shared catalogue, product variants, audited inventory movements, a transactional current balance, product management, and mobile-first stock checks. Locations, reservations, and formal stock-count workflows remain later inventory extensions.

## Milestone 3 — Identity and access (implemented)

Auth.js Credentials provides private email/password access using Argon2id password hashes and encrypted, HTTP-only JWT session cookies. Every protected request and privileged mutation resolves the immutable session user ID back to an active `StaffUser`; database role and active status remain authoritative. OWNER, MANAGER, and STAFF implement the first deliberately small role policy. Owners manage staff access, Managers operate Products and Stock, and Staff currently have read-only operational access. Inventory movements retain a nullable relation to the acting staff member.

## Milestone 4 — Commerce operations (complete)

Implemented:

- responsive Customer and Team directories, details, create, and edit flows;
- standard Orders with sequence-backed human order numbers and immutable line snapshots;
- server-calculated Decimal subtotal, discount, delivery, and total values;
- append-only Payment / Refund transactions with derived payment state;
- forward-only fulfilment, explicit cancellation rules, and protected completion;
- atomic inventory deduction and idempotent SALE movements at completion only;
- Preorders as a one-to-one Order extension sharing lines and payments;
- live dashboard order, sales, payment-attention, and stock-value information;
- Owner / Manager commerce mutations and Staff read-only commerce access;
- responsive operational lists, forms, detail views, loading, empty, and confirmation states.

Returns, reservations, supplier/import links, shipment tracking, Store checkout, CRM automation, team rosters, and profitability remain later milestones.

## Milestone 5 — Supply operations (complete)

Implemented:

- Suppliers and lightweight supplier product/terms references;
- sequence-backed Purchase Orders with immutable placed-line snapshots and manual FX snapshots;
- consolidated Import Shipments spanning multiple POs and suppliers;
- forward-moving, append-only shipment status history;
- live Incoming Stock on Stock, Product detail, and supply records;
- Decimal-safe Actual Cost to SET25 previews by quantity or product value;
- one atomic, idempotent receiving transaction with `PURCHASE_RECEIVED` movements;
- weighted-average current ProductVariant Cost Each while retaining historical import costs;
- live Dashboard Incoming and shipment attention;
- Samples with multiple 1–5 tester evaluations and average scores;
- optional Preorder-to-Purchase-Order supply context;
- Owner/Manager mutations and Staff read-only supply access.

Deferred deliberately: general Money In/Out and expense ledgers, freight invoice currencies beyond entered MVR equivalents, attachments, destructive receipt correction, reservations, per-preorder allocation, and multi-location inventory.

## Milestone 6 — Money and planning

Implement Money In, Money Out, operational profitability, tasks, and links between money/tasks and business records. Confirm reporting definitions with SET25 before encoding them.

## Milestone 7 — Relationships, content, and files

Implement ambassadors, content planning, and secure file attachments with explicit permissions and retention rules.

## Milestone 8 — Store and checkout

Build the public storefront, published catalogue, availability, cart, checkout, customer communications, and post-purchase experience against the same shared database and controlled server services.

## Rapid-development quality gates

Every milestone must include:

- responsive desktop and mobile behaviour;
- accessible semantics, keyboard use, and focus states;
- authorization and public/private data review;
- schema migration and rollback consideration when data changes;
- loading, empty, error, and success states;
- lint, typecheck, production build, and focused manual verification;
- no work from a later milestone unless it is strictly required to support the current one.

Automated tests are intentionally deferred until the product architecture and workflows stabilise.
