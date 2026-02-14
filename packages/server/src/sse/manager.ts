import { Response } from 'express';
import { randomUUID } from 'crypto';

export interface SSEClient {
  id: string;
  res: Response;
  sdkKey: string;
  connectedAt: Date;
}

class SSEManager {
  private clients: Map<string, Set<SSEClient>> = new Map();

  addClient(sdkKey: string, res: Response): SSEClient {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(':ok\n\n');

    const client: SSEClient = {
      id: randomUUID(),
      res,
      sdkKey,
      connectedAt: new Date(),
    };

    if (!this.clients.has(sdkKey)) {
      this.clients.set(sdkKey, new Set());
    }
    this.clients.get(sdkKey)!.add(client);

    return client;
  }

  removeClient(sdkKey: string, clientId: string): void {
    const clients = this.clients.get(sdkKey);
    if (!clients) return;
    for (const client of clients) {
      if (client.id === clientId) {
        clients.delete(client);
        break;
      }
    }
    if (clients.size === 0) {
      this.clients.delete(sdkKey);
    }
  }

  broadcast(sdkKey: string, event: string, data: any): void {
    const clients = this.clients.get(sdkKey);
    if (!clients) return;
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
      try {
        client.res.write(message);
      } catch {
        this.removeClient(sdkKey, client.id);
      }
    }
  }

  heartbeatAll(): void {
    for (const [, clients] of this.clients) {
      for (const client of clients) {
        try {
          client.res.write(':heartbeat\n\n');
        } catch {
          this.removeClient(client.sdkKey, client.id);
        }
      }
    }
  }

  getClientCount(sdkKey?: string): number {
    if (sdkKey) {
      return this.clients.get(sdkKey)?.size ?? 0;
    }
    let total = 0;
    for (const [, clients] of this.clients) {
      total += clients.size;
    }
    return total;
  }

  closeAll(): void {
    for (const [, clients] of this.clients) {
      for (const client of clients) {
        try {
          client.res.end();
        } catch {
          // ignore
        }
      }
    }
    this.clients.clear();
  }
}

export const sseManager = new SSEManager();
