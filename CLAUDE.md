# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read first

- **Next.js 16.4 with breaking changes.** `apps/hq/AGENTS.md` and `apps/shop/AGENTS.md` warn that APIs and conventions differ from training data. Before writing Next.js code, check the relevant guide in `apps/hq/node_modules/next/dist/docs/`. Notably, middleware is `src/proxy.ts`, and `next.config.ts` enables `cacheComponents`, `partialPrefetching`, and `reactCompiler`.
- **Product docs in `docs/` are authoritative** and get updated along with the code: `product-spec.md`, `data-model.md`, `implementation-plan.md` (milestones), and `design-system.md` (brand and UI rules). The plan's rule: don't build work from a later milestone unless the current one strictly needs it.

## Commands

pnpm workspace + Turborepo. Run these from the repo root:

```bash
pnpm dev                      # all apps (shop :3000, hq :3001)
pnpm --filter hq dev          # HQ only
pnpm lint                     # eslint across workspaces
pnpm typecheck                # tsc --noEmit across workspaces
pnpm build                    # production builds
```

Database (`packages/database`, Prisma 7, config in `prisma7.config.ts`):

```bash
pnpm --filter @set25/database generate              # also runs on postinstall
pnpm --filter @set25/database db:migrate            # prisma migrate dev
pnpm --filter @set25/database exec prisma migrate deploy
pnpm --filter @set25/database db:seed               # demo seed (sets ALLOW_DEMO_SEED=1)
pnpm --filter @set25/database db:bootstrap-owner    # needs SET25_OWNER_NAME/EMAIL/PASSWORD in packages/database/.env
pnpm --filter @set25/database db:studio
```

There are **no automated tests yet** (deliberately deferred). The quality gate is `pnpm lint`, `pnpm typecheck`, `pnpm build`, plus manual verification.

Env: put the same `DATABASE_URL` in `apps/hq/.env.local` and `packages/database/.env`. HQ also needs `AUTH_SECRET` (≥32 random bytes). See the `.env.example` files.

## Architecture

- `apps/hq`: the private staff operations app, where nearly all the work happens.
- `apps/shop`: the future public storefront (still a stub).
- `packages/database`: the Prisma schema and migrations, plus the singleton `db` client (Postgres via `@prisma/adapter-pg`). Its client is generated into `packages/database/generated/` and re-exported with enums and `Prisma` from `@set25/database`. Password hashing (Argon2id) is exported from `@set25/database/password`.
- `packages/shared`: client-safe constants, label maps, and formatters, such as `formatMVR`, the status arrays like `TASK_STATUSES`, and number formatters. Packages ship TS source directly (no build step).
- `packages/brand`: the canonical logo assets. Never modify them or recreate them as text.

HQ and Store share **one database and schema**. Separation comes from server-side projections: Store must only get published, customer-safe fields (no costs, supplier terms, margins, internal notes, or staff identity), and Store must never import HQ operations.

### HQ domain modules (`apps/hq/src/lib/<domain>/`)

Each domain (catalog, commerce, supply, money, tasks, waitlist, staff, planning, auth) follows the same split:

- `data.ts`: `import "server-only"`; Prisma read queries used by server-component pages.
- `actions.ts`: `"use server"` mutations with the signature `(…boundArgs, _state, formData) => Promise<FormState>`, used with `useActionState`. The pattern: authorize → `validateX(formData)` → return a `failure(message, errors)` state on error → write to the DB (in `db.$transaction` for multi-step changes) → `revalidatePath` → `redirect` with a `?created=`/`?saved=` flag.
- `validation.ts`: hand-written FormData parsing that returns `{ success, data | errors }` and defines the `FormState` type and its initial state. It uses no validation library.
- Optional helpers: `presentation.ts` (formatting), `costing.ts`, `money.ts`, `inventory.ts`.

Client components (`src/components/<domain>/`) must never import `@set25/database`.

### Auth and roles

Auth.js v5 Credentials (`src/auth.ts`) uses JWT session cookies. `src/proxy.ts` redirects unauthenticated requests to `/sign-in`. **Navigation and proxy checks are not authorization.** The proxy only checks for a session cookie, and the `(hq)` layout renders a static shell with the navigation behind `<Suspense>`, so it does not gate pages. Every page and action calls the helpers in `src/lib/auth/session.ts` (`requireStaff`, `requireOperationalAccess`, `requireOperationalPageAccess`, `requireOwner`). These reload the active `StaffUser` from the DB, so the DB role and `active` flag are authoritative. Roles:

- OWNER: everything, plus staff management.
- MANAGER: operational writes.
- STAFF: mostly read-only. Pages compute `canWrite = staff.role !== "STAFF"`.

### Data and business rules

- Money uses `Prisma.Decimal` end to end, never floats. Currency is MVR; display it with `formatMVR`.
- Stock changes go through audited `InventoryMovement` records via `applyInventoryMovement` (`lib/catalog/inventory.ts`) rather than by editing totals directly. Order completion deducts stock atomically, and SALE movements are idempotent.
- Payments and refunds are append-only. Payment status is derived (`lib/commerce/money.ts`).
- Order, PO, import, and sample numbers are sequence-backed. Format them with the `@set25/shared` helpers.
- Business dates use Maldives time (UTC+5). Use `lib/planning/date-range.ts` (`parseMaldivesDate`, `getTodayRange`, `getDateRange`) instead of raw `Date` math.
- Schema changes need a new migration in `packages/database/prisma/migrations/` and matching updates to `docs/data-model.md`.

### UI

Styling lives mostly in semantic classes in `apps/hq/src/app/globals.css` (a large file of brand tokens such as `--onyx`, `--volt`, and `--steel`), with Tailwind v4 imported. Pages are server components that use the shared `PageHeader`, `EmptyState`, and `page-wrap` layout. Every route has a `loading.tsx` (usually the shared `PageSkeleton`) so it has a prefetchable static shell; don't add `export const instant = false`. Mobile navigation is the bottom tab bar plus More sheet in `components/navigation.tsx`. Follow `docs/design-system.md`:

- restrained and high-contrast, with no gradients, glow, or glass effects;
- Volt is for small signals only;
- Rajdhani for display text, Inter for the interface;
- every view is responsive and mobile-first, with loading, empty, error, and success states.
