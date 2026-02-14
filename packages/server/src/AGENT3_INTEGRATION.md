# Agent 3 Integration Guide

## Files Created

| File | Purpose |
|------|---------|
| `src/sse/manager.ts` | SSE connection manager |
| `src/sse/heartbeat.ts` | SSE keepalive heartbeat |
| `src/sse/broadcast.ts` | Broadcast flag changes to SSE clients |
| `src/sse/index.ts` | Barrel export |
| `src/middleware/sdkAuth.ts` | SDK key authentication middleware |
| `src/routes/sdk.ts` | SDK endpoints (flags, stream, events, track) |
| `src/routes/analytics.ts` | Dashboard analytics endpoints |
| `src/services/analytics.ts` | Analytics buffering & querying |
| `src/services/scheduler.ts` | Scheduled flag changes |
| `src/workers/analyticsAggregator.ts` | Background event aggregation & cleanup |
| `src/prisma/agent3-migrations.sql` | SQL for `scheduled_changes` table |

## Wiring into `index.ts`

### 1. Imports

```typescript
import { sdkAuthMiddleware } from './middleware/sdkAuth.js';
import sdkRoutes from './routes/sdk.js';
import analyticsRoutes from './routes/analytics.js';
import { startHeartbeat } from './sse/heartbeat.js';
import { analyticsService } from './services/analytics.js';
import { flagScheduler } from './services/scheduler.js';
import { analyticsAggregator } from './workers/analyticsAggregator.js';
import { sseManager } from './sse/manager.js';
```

### 2. Mount Routes

```typescript
// SDK routes (SDK key auth)
app.use('/api/sdk', sdkAuthMiddleware, sdkRoutes);

// Analytics routes (JWT dashboard auth) — use your existing auth middleware
app.use('/api/projects/:projectKey/analytics', authMiddleware, analyticsRoutes);
```

### 3. Start Background Services (after app.listen)

```typescript
// SSE heartbeat (keeps connections alive)
const heartbeatTimer = startHeartbeat(15000);

// Analytics buffer flush (every 10s)
analyticsService.startPeriodicFlush();

// Scheduled flag changes (every 30s)
flagScheduler.start();

// Analytics aggregation & cleanup (every 5min)
analyticsAggregator.start();
```

### 4. Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  sseManager.closeAll();
  stopHeartbeat(heartbeatTimer);
  flagScheduler.stop();
  analyticsAggregator.stop();
  await analyticsService.stopAndFlush();
  process.exit(0);
});
```

### 5. Broadcast Flag Changes

In your flag/targeting mutation routes (e.g., `routes/flags.ts`, `routes/targeting.ts`), call after any flag update:

```typescript
import { broadcastFlagChange } from '../sse/broadcast.js';

// After updating a flag config:
await broadcastFlagChange(environmentId, flagKey);
```

### 6. Database Migration

Run the SQL in `src/prisma/agent3-migrations.sql` to create the `scheduled_changes` table:

```bash
psql $DATABASE_URL -f packages/server/src/prisma/agent3-migrations.sql
```

Or add this model to the Prisma schema:

```prisma
model ScheduledChange {
  id            String   @id @default(uuid())
  flagId        String
  environmentId String
  changeType    String
  scheduledAt   DateTime
  payload       Json?
  executed      Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([scheduledAt])
  @@index([flagId])
  @@map("scheduled_changes")
}
```
