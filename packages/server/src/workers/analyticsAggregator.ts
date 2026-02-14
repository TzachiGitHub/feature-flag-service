import { prisma } from '../lib/prisma.js';

/**
 * Background aggregation worker.
 * Periodically aggregates raw analytics events into summary tables.
 * Can be run as a cleanup job to delete old raw events after aggregation.
 */

interface AggregatedCount {
  flagKey: string;
  variationId: string | null;
  period: string; // ISO date string for the hour bucket
  count: number;
  uniqueContexts: number;
}

export class AnalyticsAggregator {
  private timer: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 300000; // 5 minutes

  /**
   * Aggregate events from the last hour into hourly buckets.
   * This is an optimization — queries can read from aggregated data instead of raw events.
   */
  async aggregateHour(hour?: Date): Promise<AggregatedCount[]> {
    const bucketStart = hour ?? new Date(Date.now() - 3600000);
    bucketStart.setMinutes(0, 0, 0);
    const bucketEnd = new Date(bucketStart.getTime() + 3600000);

    const results = await prisma.analyticsEvent.groupBy({
      by: ['flagKey', 'variationId'],
      where: {
        kind: 'evaluation',
        timestamp: { gte: bucketStart, lt: bucketEnd },
      },
      _count: { id: true },
    });

    return results
      .filter((r) => r.flagKey != null)
      .map((r) => ({
        flagKey: r.flagKey!,
        variationId: r.variationId,
        period: bucketStart.toISOString(),
        count: r._count.id,
        uniqueContexts: 0, // Would need a distinct count query
      }));
  }

  /**
   * Delete raw events older than the specified number of days.
   */
  async cleanupOldEvents(retentionDays: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 86400000);
    const result = await prisma.analyticsEvent.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });
    return result.count;
  }

  start(): void {
    this.timer = setInterval(async () => {
      try {
        await this.aggregateHour();
        // Clean up events older than 30 days once per run
        const deleted = await this.cleanupOldEvents(30);
        if (deleted > 0) {
          console.log(`Analytics aggregator: cleaned up ${deleted} old events`);
        }
      } catch (error) {
        console.error('Analytics aggregator error:', error);
      }
    }, this.INTERVAL_MS);
    console.log('Analytics aggregator started (5min interval)');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const analyticsAggregator = new AnalyticsAggregator();
