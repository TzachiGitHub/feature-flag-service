import { prisma } from '../lib/prisma.js';

interface AnalyticsEvent {
  kind: string;
  key?: string;
  flagKey?: string;
  variationId?: string;
  contextKey: string;
  contextKind: string;
  value?: any;
  data?: any;
  timestamp: string;
}

interface BufferedEvent extends AnalyticsEvent {
  sdkKey: string;
}

class AnalyticsService {
  private buffer: BufferedEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly MAX_BUFFER = 1000;
  private readonly FLUSH_INTERVAL_MS = 10000;

  addEvents(sdkKey: string, events: AnalyticsEvent[]): void {
    for (const event of events) {
      this.buffer.push({ ...event, sdkKey });
    }
    if (this.buffer.length >= this.MAX_BUFFER) {
      this.flush().catch(console.error);
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = this.buffer.splice(0);

    try {
      await prisma.analyticsEvent.createMany({
        data: events.map((e) => ({
          kind: e.kind,
          flagKey: e.flagKey ?? e.key ?? null,
          variationId: e.variationId ?? null,
          contextKey: e.contextKey,
          contextKind: e.contextKind,
          value: e.value != null ? e.value : undefined,
          data: e.data != null ? e.data : undefined,
          timestamp: new Date(e.timestamp),
        })),
      });
    } catch (error) {
      console.error('Analytics flush error:', error);
      // Put events back at the front
      this.buffer.unshift(...events);
    }
  }

  async getEvaluationCounts(
    projectId: string,
    options: {
      flagKey?: string;
      period?: '1h' | '24h' | '7d' | '30d';
      from?: Date;
      to?: Date;
    } = {}
  ): Promise<Array<{ flagKey: string; count: number; uniqueContexts: number }>> {
    const from = options.from ?? this.periodToDate(options.period ?? '24h');
    const to = options.to ?? new Date();

    const where: any = {
      kind: 'evaluation',
      timestamp: { gte: from, lte: to },
    };

    // Filter by project flags
    const projectFlags = await prisma.flag.findMany({
      where: { projectId, archived: false },
      select: { key: true },
    });
    const flagKeys = projectFlags.map((f) => f.key);
    if (flagKeys.length === 0) return [];

    where.flagKey = options.flagKey ? options.flagKey : { in: flagKeys };

    const results = await prisma.analyticsEvent.groupBy({
      by: ['flagKey'],
      where,
      _count: { id: true },
    });

    // Get unique contexts per flag
    const uniqueCounts = await prisma.analyticsEvent.groupBy({
      by: ['flagKey', 'contextKey'],
      where,
    });

    const uniqueMap = new Map<string, Set<string>>();
    for (const row of uniqueCounts) {
      if (!row.flagKey) continue;
      if (!uniqueMap.has(row.flagKey)) uniqueMap.set(row.flagKey, new Set());
      uniqueMap.get(row.flagKey)!.add(row.contextKey);
    }

    return results
      .filter((r) => r.flagKey != null)
      .map((r) => ({
        flagKey: r.flagKey!,
        count: r._count.id,
        uniqueContexts: uniqueMap.get(r.flagKey!)?.size ?? 0,
      }));
  }

  async getVariationBreakdown(
    projectId: string,
    flagKey: string,
    period?: string
  ): Promise<Array<{ variationId: string; count: number; percentage: number }>> {
    const from = this.periodToDate((period as any) ?? '24h');

    const results = await prisma.analyticsEvent.groupBy({
      by: ['variationId'],
      where: {
        kind: 'evaluation',
        flagKey,
        timestamp: { gte: from },
        variationId: { not: null },
      },
      _count: { id: true },
    });

    const total = results.reduce((sum, r) => sum + r._count.id, 0);

    return results.map((r) => ({
      variationId: r.variationId!,
      count: r._count.id,
      percentage: total > 0 ? Math.round((r._count.id / total) * 10000) / 100 : 0,
    }));
  }

  async getStaleFlags(projectId: string, staleDays: number = 7): Promise<string[]> {
    const cutoff = new Date(Date.now() - staleDays * 86400000);

    const allFlags = await prisma.flag.findMany({
      where: { projectId, archived: false },
      select: { key: true },
    });

    const recentFlags = await prisma.analyticsEvent.groupBy({
      by: ['flagKey'],
      where: {
        flagKey: { in: allFlags.map((f) => f.key) },
        timestamp: { gte: cutoff },
      },
    });

    const recentKeys = new Set(recentFlags.map((r) => r.flagKey));
    return allFlags.filter((f) => !recentKeys.has(f.key)).map((f) => f.key);
  }

  startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.FLUSH_INTERVAL_MS);
  }

  async stopAndFlush(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  private periodToDate(period: '1h' | '24h' | '7d' | '30d'): Date {
    const ms: Record<string, number> = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000,
    };
    return new Date(Date.now() - (ms[period] ?? ms['24h']));
  }
}

export const analyticsService = new AnalyticsService();
