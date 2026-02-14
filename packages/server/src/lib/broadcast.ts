import { EventEmitter } from 'events';
import type { Response } from 'express';

const emitter = new EventEmitter();
emitter.setMaxListeners(1000);

const connections = new Map<string, Set<Response>>();

export function addSSEClient(environmentId: string, res: Response): void {
  if (!connections.has(environmentId)) {
    connections.set(environmentId, new Set());
  }
  connections.get(environmentId)!.add(res);

  res.on('close', () => {
    connections.get(environmentId)?.delete(res);
    if (connections.get(environmentId)?.size === 0) {
      connections.delete(environmentId);
    }
  });
}

export function broadcastFlagChange(environmentId: string, flagKey: string): void {
  const clients = connections.get(environmentId);
  if (!clients || clients.size === 0) return;

  const data = JSON.stringify({ type: 'flag.updated', flagKey, timestamp: new Date().toISOString() });
  for (const res of clients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {
      clients.delete(res);
    }
  }
}

export function setBroadcastFn(_fn: typeof broadcastFlagChange) {
  // Kept for backward compatibility — broadcastFlagChange is now the real implementation
}
