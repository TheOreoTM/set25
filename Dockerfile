# One image per app for the VPS (Dokploy). Vercel ignores this file.
#
#   docker build --build-arg APP=hq -t set25-hq .
#   docker build --build-arg APP=shop --build-arg NEXT_PUBLIC_SITE_URL=https://set25.mv \
#     --build-arg PUBLIC_MEDIA_BASE_URL=https://files.set25.oreotm.xyz -t set25-shop .
#
# APP is the folder under apps/ (hq, shop). NEXT_PUBLIC_SITE_URL and
# PUBLIC_MEDIA_BASE_URL are read when the shop is built (metadata and the
# image optimizer's allowed host), so pass the values it runs with.
# Secrets (DATABASE_URL, AUTH_SECRET, R2 keys) are runtime environment
# variables only.

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS build
ARG APP
ARG NEXT_PUBLIC_SITE_URL=https://set25.mv
ARG PUBLIC_MEDIA_BASE_URL=
RUN test -n "$APP" || (echo "Pass --build-arg APP=hq or APP=shop" && exit 1)
RUN corepack enable
WORKDIR /repo
# prisma generate (postinstall) needs DATABASE_URL set; it never connects.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/hq/package.json apps/hq/
COPY apps/shop/package.json apps/shop/
COPY packages packages
RUN pnpm install --frozen-lockfile --filter "${APP}..." --filter "@set25/database" \
 && pnpm --filter @set25/database generate

COPY . .
ENV NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    PUBLIC_MEDIA_BASE_URL=${PUBLIC_MEDIA_BASE_URL} \
    AUTH_SECRET=build-only-secret-not-used-at-runtime-0000
RUN pnpm --filter "${APP}" build

# The standalone server serves public/ and .next/static only if they sit
# next to it.
RUN set -eux; \
    out="apps/${APP}/.next/standalone/apps/${APP}"; \
    cp -r "apps/${APP}/.next/static" "$out/.next/static"; \
    if [ -d "apps/${APP}/public" ]; then cp -r "apps/${APP}/public" "$out/public"; fi

FROM ${NODE_IMAGE} AS run
ARG APP
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/${APP}/.next/standalone ./
WORKDIR /app/apps/${APP}
USER node
EXPOSE 3000
CMD ["node", "server.js"]
