# SET25 Platform Implementation Plan

## Milestone 1 — HQ foundation (current)

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

## Milestone 2 — Catalogue and stock foundation (current)

Evolve Product and ProductVariant deliberately. Add publication rules, locations, inventory movements, balances, reservations, stock counts, product management, and mobile-first stock checks. Migrate the temporary aggregate stock field safely.

The current milestone implements the shared catalogue, product variants, audited inventory movements, a transactional current balance, product management, and mobile-first stock checks. Locations, reservations, and formal stock-count workflows remain later inventory extensions.

## Milestone 3 — Identity and access

Select and implement authentication based on deployment constraints. Add staff users, sessions, minimal roles, protected HQ routes, server-side authorization helpers, sign-in/out, and audit identity. Do not rely on navigation visibility for authorization.

## Milestone 4 — Commerce operations

Implement customers, teams, orders, payments, fulfilment, and preorders. Expose only controlled Store operations and public product projections. Preserve immutable order facts.

## Milestone 5 — Supply operations

Implement suppliers, purchase orders, imports, incoming stock, shipment events, receiving, samples, and Actual Cost to SET25 calculations.

## Milestone 6 — Money and planning

Implement Money In, Money Out, operational profitability, tasks, and links between money/tasks and business records. Confirm reporting definitions with SET25 before encoding them.

## Milestone 7 — Relationships, content, and files

Implement ambassadors, content planning, and secure file attachments with explicit permissions and retention rules.

## Milestone 8 — Store and checkout

Build the public storefront, published catalogue, availability, cart, checkout, customer communications, and post-purchase experience against the same shared database and controlled server services.

## Cross-cutting quality gates

Every milestone must include:

- responsive desktop and mobile behaviour;
- accessible semantics, keyboard use, and focus states;
- authorization and public/private data review;
- schema migration and rollback consideration when data changes;
- loading, empty, error, and success states;
- lint, typecheck, tests appropriate to the change, and production build;
- no work from a later milestone unless it is strictly required to support the current one.
