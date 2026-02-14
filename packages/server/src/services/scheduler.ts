import { prisma } from '../lib/prisma.js';
import { broadcastFlagChange } from '../sse/broadcast.js';

export interface ScheduledChange {
  id: string;
  flagId: string;
  environmentId: string;
  changeType: 'toggle_on' | 'toggle_off' | 'update_targeting';
  scheduledAt: Date;
  payload?: any;
  executed: boolean;
}

class FlagScheduler {
  private timer: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 30000;

  async schedule(
    change: Omit<ScheduledChange, 'id' | 'executed'>
  ): Promise<ScheduledChange> {
    const result = await prisma.$queryRaw<ScheduledChange[]>`
      INSERT INTO scheduled_changes (flag_id, environment_id, change_type, scheduled_at, payload, executed)
      VALUES (${change.flagId}, ${change.environmentId}, ${change.changeType}, ${change.scheduledAt}, ${JSON.stringify(change.payload ?? null)}::jsonb, false)
      RETURNING id, flag_id as "flagId", environment_id as "environmentId", change_type as "changeType", scheduled_at as "scheduledAt", payload, executed
    `;
    return result[0];
  }

  async cancel(id: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM scheduled_changes WHERE id = ${id} AND executed = false
    `;
  }

  async getPending(flagId: string): Promise<ScheduledChange[]> {
    return prisma.$queryRaw<ScheduledChange[]>`
      SELECT id, flag_id as "flagId", environment_id as "environmentId",
             change_type as "changeType", scheduled_at as "scheduledAt", payload, executed
      FROM scheduled_changes
      WHERE flag_id = ${flagId} AND executed = false
      ORDER BY scheduled_at ASC
    `;
  }

  async processDueChanges(): Promise<void> {
    const now = new Date();

    const dueChanges = await prisma.$queryRaw<ScheduledChange[]>`
      SELECT id, flag_id as "flagId", environment_id as "environmentId",
             change_type as "changeType", scheduled_at as "scheduledAt", payload, executed
      FROM scheduled_changes
      WHERE executed = false AND scheduled_at <= ${now}
      ORDER BY scheduled_at ASC
    `;

    for (const change of dueChanges) {
      try {
        if (change.changeType === 'toggle_on' || change.changeType === 'toggle_off') {
          await prisma.flagEnvironmentConfig.updateMany({
            where: { flagId: change.flagId, environmentId: change.environmentId },
            data: { on: change.changeType === 'toggle_on' },
          });
        } else if (change.changeType === 'update_targeting' && change.payload) {
          await prisma.flagEnvironmentConfig.updateMany({
            where: { flagId: change.flagId, environmentId: change.environmentId },
            data: change.payload,
          });
        }

        await prisma.$executeRaw`
          UPDATE scheduled_changes SET executed = true WHERE id = ${change.id}
        `;

        // Get flag key for broadcast
        const flag = await prisma.flag.findUnique({
          where: { id: change.flagId },
          select: { key: true },
        });
        if (flag) {
          await broadcastFlagChange(change.environmentId, flag.key);
        }
      } catch (error) {
        console.error(`Error executing scheduled change ${change.id}:`, error);
      }
    }
  }

  start(): void {
    this.timer = setInterval(() => {
      this.processDueChanges().catch(console.error);
    }, this.INTERVAL_MS);
    console.log('Flag scheduler started (30s interval)');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const flagScheduler = new FlagScheduler();
