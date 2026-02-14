import { sseManager } from './manager.js';

export function startHeartbeat(intervalMs: number = 15000): NodeJS.Timeout {
  return setInterval(() => {
    sseManager.heartbeatAll();
  }, intervalMs);
}

export function stopHeartbeat(timer: NodeJS.Timeout): void {
  clearInterval(timer);
}
