# MODENACEAC 6XSIM — Dockerfile
# Multi-stage build: builder → runner (Debian-based para evitar problemas de OpenSSL con Prisma)

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma/       ./prisma/
COPY src/          ./src/

RUN npx prisma generate
RUN npm run build

# ── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
    chromium \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Usuario no-root para seguridad
RUN groupadd -g 1001 sixsim && useradd -u 1001 -g sixsim -s /bin/sh -m sixsim

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

COPY --from=builder --chown=sixsim:sixsim /app/node_modules ./node_modules
COPY --from=builder --chown=sixsim:sixsim /app/dist         ./dist
COPY --from=builder --chown=sixsim:sixsim /app/prisma       ./prisma
COPY --from=builder --chown=sixsim:sixsim /app/package.json ./

RUN mkdir -p /app/pdfs /app/logs && chown -R sixsim:sixsim /app

USER sixsim

EXPOSE 3000

CMD ["node", "dist/server.js"]
