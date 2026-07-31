# KBDL backend (Express) — monorepo-aware image
# Build context: kbdl-turborepo root

FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# Install workspace deps for backend + its package graph
# ---------------------------------------------------------------------------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/kbdl-backend/package.json ./apps/kbdl-backend/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/validator/package.json ./packages/validator/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --filter kbdl-backend... --frozen-lockfile

# ---------------------------------------------------------------------------
# Build Prisma client + backend bundle
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app /app

COPY apps/kbdl-backend ./apps/kbdl-backend
COPY packages/db ./packages/db
COPY packages/types ./packages/types
COPY packages/validator ./packages/validator
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config

# Prisma generate needs a dummy URL at generate-time for some configs
ENV DATABASE_URL="postgresql://kbdl:kbdl@postgres:5432/kbdl?schema=public"

RUN pnpm --filter @repo/db generate \
  && pnpm --filter kbdl-backend build

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8000

COPY --from=builder /app /app
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN sed -i 's/\r$//' /app/docker/entrypoint.sh \
  && chmod +x /app/docker/entrypoint.sh

WORKDIR /app
EXPOSE 8000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["start"]
