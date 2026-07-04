# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Dockerfile multi-stage pour Manabu (TanStack Start + Nitro node-server)
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- deps : installe toutes les dépendances (avec cache) --------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build : génère les routes puis build l'app ----------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run generate-routes && pnpm run build

# ---- prod-deps : uniquement les dépendances de production ------------------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

# ---- runtime : image finale légère -----------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Le build Nitro (.output) est autonome ; on copie aussi les fichiers de
# migration + le nécessaire pour lancer drizzle-kit migrate au démarrage.
COPY --from=build /app/.output ./.output
COPY --from=build /app/drizzle ./drizzle
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml drizzle.config.ts ./
COPY src/db ./src/db
COPY docker/entrypoint.sh ./docker/entrypoint.sh

RUN corepack enable && chmod +x ./docker/entrypoint.sh

EXPOSE 3000
CMD ["./docker/entrypoint.sh"]
