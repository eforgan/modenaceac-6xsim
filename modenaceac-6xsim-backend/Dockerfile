# MODENACEAC 6XSIM — Dockerfile
# Multi-stage build: builder → runner

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias nativas para Puppeteer
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production && npm ci

COPY tsconfig.json ./
COPY prisma/       ./prisma/
COPY src/          ./src/

RUN npx prisma generate
RUN npm run build

# ── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Chromium para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    curl

# Usuario no-root para seguridad
RUN addgroup -g 1001 sixsim && adduser -u 1001 -G sixsim -s /bin/sh -D sixsim

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

COPY --from=builder --chown=sixsim:sixsim /app/node_modules ./node_modules
COPY --from=builder --chown=sixsim:sixsim /app/dist         ./dist
COPY --from=builder --chown=sixsim:sixsim /app/prisma       ./prisma
COPY --from=builder --chown=sixsim:sixsim /app/package.json ./

RUN mkdir -p /app/pdfs /app/logs && chown -R sixsim:sixsim /app

USER sixsim

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
