# ============================================
# MindPocket Web - Single Service Docker Build
# ============================================

FROM node:22-alpine AS builder

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@10.9.0 --activate

WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild bcrypt

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @repo/types build && \
    cd apps/web && npx next build

# ============================================
# Migrator stage - minimal DB migration tools
# Only installs what's needed to run drizzle-kit push
# and ensure-extensions.ts at container startup.
# This replaces copying the entire 3.5GB workspace.
# ============================================
FROM node:22-alpine AS migrator

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN corepack enable && corepack prepare pnpm@10.9.0 --activate

WORKDIR /migrate

# Minimal tsconfig that doesn't depend on workspace packages
RUN printf '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "commonjs",\n    "moduleResolution": "node",\n    "esModuleInterop": true,\n    "strict": true,\n    "baseUrl": "."\n  }\n}\n' > tsconfig.json

# Install only migration dependencies
RUN echo '{"name":"migrate","version":"1.0.0","private":true}' > package.json && \
    pnpm add tsx@^4.21.0 drizzle-kit@^0.31.8 drizzle-orm@^0.45.1 pg@^8.16.3 @types/pg@^8.15.6

# Copy only the files required for migrations (preserve relative import paths)
COPY --from=builder /app/apps/web/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/apps/web/db ./db
COPY --from=builder /app/apps/web/lib/database-url.ts ./lib/database-url.ts
COPY --from=builder /app/apps/web/scripts/ensure-extensions.ts ./scripts/ensure-extensions.ts

# ============================================
# Runner stage
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone app
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Minimal migration workspace (~200MB vs 3.5GB before)
COPY --from=migrator --chown=nextjs:nodejs /migrate /migrate

COPY --chown=nextjs:nodejs --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
