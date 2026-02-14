import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate as authMiddleware } from './middleware/auth.js';
import { sdkAuthMiddleware } from './middleware/sdkAuth.js';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import environmentRoutes from './routes/environments.js';
import flagRoutes from './routes/flags.js';
import targetingRoutes from './routes/targeting.js';
import segmentRoutes from './routes/segments.js';
import auditLogRoutes from './routes/auditLog.js';
import sdkRoutes from './routes/sdk.js';
import analyticsRoutes from './routes/analytics.js';

import { startHeartbeat, stopHeartbeat } from './sse/heartbeat.js';
import { analyticsService } from './services/analytics.js';
import { flagScheduler } from './services/scheduler.js';
import { analyticsAggregator } from './workers/analyticsAggregator.js';
import { sseManager } from './sse/manager.js';
import { broadcastFlagChange } from './sse/broadcast.js';
import { setBroadcastFn } from './lib/broadcast.js';

// Wire real broadcast implementation
setBroadcastFn(broadcastFlagChange);

const app = express();
const PORT = parseInt(process.env.PORT || '3020', 10);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectKey/environments', environmentRoutes);
app.use('/api/projects/:projectKey/flags', flagRoutes);
app.use('/api/projects/:projectKey/flags', targetingRoutes);
app.use('/api/projects/:projectKey/segments', segmentRoutes);
app.use('/api/projects/:projectKey/audit-log', auditLogRoutes);

// SDK routes (SDK key auth)
app.use('/api/sdk', sdkAuthMiddleware, sdkRoutes);

// Analytics routes (JWT dashboard auth)
app.use('/api/projects/:projectKey/analytics', authMiddleware, analyticsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Feature Flag Server running on port ${PORT}`);

  // Start background services
  const heartbeatTimer = startHeartbeat(15000);
  analyticsService.startPeriodicFlush();
  flagScheduler.start();
  analyticsAggregator.start();

  process.on('SIGTERM', async () => {
    sseManager.closeAll();
    stopHeartbeat(heartbeatTimer);
    flagScheduler.stop();
    analyticsAggregator.stop();
    await analyticsService.stopAndFlush();
    process.exit(0);
  });
});

export { app };
export { broadcastFlagChange, setBroadcastFn } from './lib/broadcast.js';
