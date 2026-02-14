FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/sdk-js/package.json packages/sdk-js/
COPY packages/sdk-react/package.json packages/sdk-react/
COPY packages/dashboard/package.json packages/dashboard/
COPY test-app/package.json test-app/

# Install all dependencies
RUN npm install

# Copy all source
COPY . .

# Build shared package first (dependency of others)
RUN cd packages/shared && npm run build 2>/dev/null || true

# Build SDK packages
RUN cd packages/sdk-js && npm run build 2>/dev/null || true
RUN cd packages/sdk-react && npm run build 2>/dev/null || true

# Build dashboard
RUN cd packages/dashboard && npm run build

# Build test app
RUN cd test-app && npm run build

# Generate Prisma client
RUN cd packages/server && npx prisma generate --schema=src/prisma/schema.prisma

EXPOSE 3020

# Push schema and start server
CMD cd packages/server && npx prisma db push --schema=src/prisma/schema.prisma --accept-data-loss && \
    npx tsx -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$executeRawUnsafe('CREATE TABLE IF NOT EXISTS scheduled_changes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), flag_id TEXT NOT NULL, environment_id TEXT NOT NULL, change_type TEXT NOT NULL, scheduled_at TIMESTAMPTZ NOT NULL, payload JSONB, executed BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW())').then(() => p.\$disconnect()).catch(() => p.\$disconnect())" 2>/dev/null; \
    npx tsx src/index.ts
