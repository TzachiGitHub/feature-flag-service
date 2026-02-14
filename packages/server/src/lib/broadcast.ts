// No-op placeholder — Agent 3 will implement real SSE broadcasting
export let broadcastFlagChange = (_environmentId: string, _flagKey: string): void => {
  // Will be implemented by Agent 3 for SSE push
};

export function setBroadcastFn(fn: typeof broadcastFlagChange) {
  broadcastFlagChange = fn;
}
