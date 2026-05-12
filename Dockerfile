# syntax=docker/dockerfile:1.7
# Multi-stage Next.js production image.
# Build:  docker build -t hr-tech:local .
# Run:    docker run --env-file .env -p 3000:3000 hr-tech:local

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --include=dev

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma needs a syntactically valid DATABASE_URL during `next build`,
# but never connects. Real value is supplied at runtime.
ENV DATABASE_URL="postgresql://build:build@build:5432/build?schema=public"
ENV AUTH_SECRET="build-time-placeholder-secret-not-used-at-runtime"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl tini

# Install Prisma CLI globally so the entrypoint can run `prisma db push` on boot.
# The standalone Next.js output only ships runtime deps; prisma is a dev dep.
# Keep the version in lockstep with package.json.
RUN npm install -g prisma@6.19.2 && npm cache clean --force

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Generated Prisma client (`.prisma/client`) and `@prisma/client` runtime —
# copy explicitly so we don't depend on Next's standalone tracer catching them.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]
CMD ["node", "server.js"]
