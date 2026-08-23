FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ENV NODE_ENV=production
ENV DATABASE_URL=file:/tmp/kiroku-build.db
ENV APP_NAME=Kiroku
ENV APP_URL=http://localhost:3000
ENV AUTH_SECRET=build-only-placeholder-session-secret-123456
ENV REGISTRATION_ENABLED=true
ENV UPLOAD_DIR=/tmp/kiroku-uploads
ENV MAX_UPLOAD_SIZE_MB=10
ENV DEFAULT_CURRENCY=USD
ENV DEFAULT_DISTANCE_UNIT=MI
ENV DEFAULT_VOLUME_UNIT=GAL
ENV DEFAULT_ECONOMY_UNIT=MPG
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/data/kiroku.db
ENV APP_DATA_DIR=/app/data
ENV UPLOAD_DIR=/app/data/uploads
ENV APP_NAME=Kiroku
ENV APP_URL=http://localhost:3000
ENV REGISTRATION_ENABLED=true
ENV MAX_UPLOAD_SIZE_MB=10
ENV DEFAULT_CURRENCY=USD
ENV DEFAULT_DISTANCE_UNIT=MI
ENV DEFAULT_VOLUME_UNIT=GAL
ENV DEFAULT_ECONOMY_UNIT=MPG

RUN apt-get update \
  && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 kiroku \
  && useradd --uid 10001 --gid 10001 --home-dir /app --shell /usr/sbin/nologin kiroku

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh /usr/local/bin/kiroku-entrypoint
RUN chmod +x /usr/local/bin/kiroku-entrypoint

EXPOSE 3000
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["kiroku-entrypoint"]
CMD ["npm", "run", "start"]
