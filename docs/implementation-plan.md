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

Auth.js Credentials provides private username/password access using Argon2id password hashes and encrypted, HTTP-only JWT session cookies. Every protected request and privileged mutation resolves the immutable session user ID back to an active `StaffUser`; database role and active status remain authoritative. OWNER, MANAGER, and STAFF implement the first deliberately small role policy. Owners manage staff access, Managers operate Products and Stock, and Staff currently have read-only operational access. Inventory movements retain a nullable relation to the acting staff member.

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

## Milestone 6 — Money and planning (complete)

Implemented:

- append-only, idempotent manual Money In / Money Out entries in MVR;
- one-source Money history combining existing Payment/Refund transactions with manual entries without duplication;
- date presets, custom ranges, direction/category/search filters, and explicit Net Cash Recorded wording;
- completed-order Sales Revenue and historical OrderLine-based Cost of Items Sold;
- Sales Profit that becomes unavailable when historical cost data is incomplete;
- Operating Expenses and Operating Profit with inventory acquisition and equipment excluded to prevent double-counting or ambiguous treatment;
- optional Money links to Supplier, Purchase Order, Import, or Order plus payment context on PO and Import detail pages;
- operational Tasks with status, priority, due date, assignee, and one validated business-record relation;
- live dashboard Sales Profit, incomplete stock valuation context, task attention, and upcoming tasks;
- Owner/Manager Money and Task mutations; Staff read-only Money and status-only updates on their own assigned Tasks;
- Decimal-safe server/client DTOs and responsive Money/Task rows and forms.

Deferred deliberately: bank reconciliation, formal bookkeeping, double entry, tax filing, payroll, invoice generation, reversal tooling, original-currency ledgers, equipment accounting treatment, task comments, notifications, recurring tasks, Kanban, and Milestone 7 entities.

## Milestone 7 — Relationships, content, and files (implemented, awaiting manual verification)

Implemented:

- Ambassadors with status, contact details, uppercase-unique discount codes, and validated discount/commission reference terms;
- transactional, idempotent Give Product: conditional stock decrement, `GIVEAWAY` movement, and append-only grants with product snapshots;
- a Content planner grouped by Overdue/Today/This Week/Upcoming/Unscheduled/Posted, with status, platform, owner, product, and search filters;
- content status rules (Scheduled needs a publish time; Posted sets `postedAt`) enforced in actions and database checks, with contextual status actions;
- private S3-compatible file storage (Cloudflare R2) behind an adapter: presigned direct uploads, Pending → verified Available finalisation, and role-checked 60-second signed downloads;
- file access levels, retention dates with download blocking, and storage-first audited deletion;
- one reusable Files panel on ten record types, plus `/files` and `/files/[id]`;
- dashboard overdue content, retention-expired files (Owner), and next-seven-days content.

Requires the `R2_*` variables (see `apps/hq/.env.example`) and a private bucket with CORS allowing `PUT` from the HQ origin. Without them, HQ runs normally and file uploads explain that storage is not configured.

Deferred deliberately: Store discount redemption, commission payouts, social posting integrations, campaign analytics, file versioning, virus scanning, abandoned-upload cleanup jobs, and a generic audit log.

## Milestone 8 — Public Store and checkout (implemented, awaiting manual verification)

Implemented:

- a branded, mobile-first public Store: home, `/shop` with category and availability filters, product detail with accessible colour/size selection, cart, guest checkout, order confirmation, About, and branded empty/error/not-found states;
- explicit public catalogue, settings, and order projections that exclude every private HQ field;
- public `ProductMedia` in a separate public bucket, managed from the HQ product page;
- one canonical available-to-sell helper used by Store listing, product detail, checkout, and HQ `/stock`;
- `StockReservation` holds created at checkout, expired lazily, extended once paid or in fulfilment, consumed by completion, and released by cancellation;
- a server-authoritative, row-locked, idempotent checkout transaction that creates ONLINE orders with immutable line, delivery, payment-intention, and discount snapshots;
- Customer reuse by normalised phone;
- ambassador discount codes validated and snapshotted server-side, with ambassador attribution;
- unguessable public order tokens;
- HQ `/settings/store` for Store Open, contact, instructions, reservation hours, and delivery options;
- an HQ order detail Store checkout panel;
- pragmatic in-memory rate limits and a no-op customer messaging boundary;
- product-specific metadata and Open Graph data, plus `robots.txt`.

Requires the `store_checkout` migration. Public images also need `R2_PUBLIC_BUCKET_NAME` and `PUBLIC_MEDIA_BASE_URL` in HQ and `PUBLIC_MEDIA_BASE_URL` in the Store.

Deferred deliberately: payment-proof upload (customers send slips by WhatsApp or Instagram), confirmation email/SMS/WhatsApp, online card payments, customer accounts, commission payouts, courier integration, a sitemap, shared rate limiting, on-demand Store revalidation, and reservation-aware blocking of HQ manual sales.

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
