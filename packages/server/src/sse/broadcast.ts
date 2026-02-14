import { prisma } from '../lib/prisma.js';
import { sseManager } from './manager.js';

/**
 * Called by flag mutation routes when a flag changes.
 * Looks up the environment's SDK keys and broadcasts the change via SSE.
 */
export async function broadcastFlagChange(
  environmentId: string,
  flagKey: string,
  data?: any
): Promise<void> {
  const env = await prisma.environment.findUnique({
    where: { id: environmentId },
    select: { sdkKey: true, sdkKeyServer: true },
  });
  if (!env) return;

  const payload = { flagKey, ...data };

  sseManager.broadcast(env.sdkKey, 'patch', payload);
  sseManager.broadcast(env.sdkKeyServer, 'patch', payload);
}
