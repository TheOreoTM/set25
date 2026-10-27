# SET25 HQ

Private staff operations for SET25.

## Local setup

```bash
cp apps/hq/.env.example apps/hq/.env.local
cp packages/database/.env.example packages/database/.env
```

Set the same `DATABASE_URL` in both files. Generate a strong `AUTH_SECRET` of at least 32 random bytes for `apps/hq/.env.local`.

Apply migrations, then create the first Owner explicitly. Temporarily add `SET25_OWNER_NAME`, `SET25_OWNER_USERNAME`, and `SET25_OWNER_PASSWORD` to `packages/database/.env`, using a password of 12–128 characters.

```bash
pnpm --filter @set25/database exec prisma migrate deploy
pnpm --filter @set25/database db:bootstrap-owner
```

The bootstrap refuses to overwrite an existing Owner and never logs the password. Remove the three Owner variables from the environment file after use.

Start HQ:

```bash
pnpm --filter hq dev
```

Open [http://localhost:3001](http://localhost:3001). Unauthenticated requests are redirected to `/sign-in`.

## Rapid-development checks

Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` from the repository root. Automated tests are intentionally deferred during rapid development.
