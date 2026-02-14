import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sseManager } from '../sse/manager.js';
import { analyticsService } from '../services/analytics.js';

const router = Router();

/**
 * GET /flags — Bulk flag download
 * Query: ?context=<base64-encoded-json>
 */
router.get('/flags', async (req: Request, res: Response) => {
  try {
    const env = req.sdkEnvironment!;
    let context: any = null;

    if (req.query.context) {
      try {
        context = JSON.parse(
          Buffer.from(req.query.context as string, 'base64').toString('utf-8')
        );
      } catch {
        res.status(400).json({ error: 'Invalid context: must be base64-encoded JSON' });
        return;
      }
    }

    const flagConfigs = await prisma.flagEnvironmentConfig.findMany({
      where: { environmentId: env.id },
      include: {
        flag: {
          select: {
            key: true,
            type: true,
            variations: true,
            archived: true,
          },
        },
      },
    });

    const flags: Record<string, any> = {};

    for (const config of flagConfigs) {
      if (config.flag.archived) continue;

      const variations = config.flag.variations as any[];

      if (!context) {
        // No context — return raw definitions for client-side evaluation
        flags[config.flag.key] = {
          key: config.flag.key,
          type: config.flag.type,
          on: config.on,
          variations,
          offVariationId: config.offVariationId,
          fallthrough: config.fallthrough,
          targets: config.targets,
          rules: config.rules,
          version: config.version,
        };
      } else {
        // With context — evaluate server-side
        let value: any;
        let variationId: string | null = null;
        let reason = 'FALLTHROUGH';

        if (!config.on) {
          reason = 'OFF';
          variationId = config.offVariationId ?? null;
        } else {
          // 1. Check individual targets
          const targets = (config.targets as any[]) || [];
          let matched = false;
          for (const target of targets) {
            if (target.values && target.values.includes(context.key)) {
              variationId = target.variationId;
              reason = 'TARGET_MATCH';
              matched = true;
              break;
            }
          }

          // 2. Check rules
          if (!matched) {
            const rules = (config.rules as any[]) || [];
            for (const rule of rules) {
              const clauses = rule.clauses || [];
              const allMatch = clauses.every((clause: any) => {
                const attrValue = context.attributes?.[clause.attribute] ?? (context as any)[clause.attribute];
                if (clause.op === 'in') {
                  return clause.values?.includes(attrValue);
                } else if (clause.op === 'eq') {
                  return clause.values?.includes(attrValue);
                } else if (clause.op === 'contains') {
                  return typeof attrValue === 'string' && clause.values?.some((v: string) => attrValue.includes(v));
                }
                return false;
              });
              if (allMatch && clauses.length > 0) {
                variationId = rule.variationId;
                reason = 'RULE_MATCH';
                matched = true;
                break;
              }
            }
          }

          // 3. Fallthrough
          if (!matched) {
            const ft = config.fallthrough as any;
            if (ft?.rollout) {
              // Percentage rollout — hash context key
              const hash = Array.from(context.key || 'anonymous').reduce((h: number, c: string) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
              const bucket = Math.abs(hash) % 100000;
              let cumulative = 0;
              for (const rv of ft.rollout.variations || []) {
                cumulative += rv.weight;
                if (bucket < cumulative) {
                  variationId = rv.variationId;
                  break;
                }
              }
              if (!variationId && ft.rollout.variations?.length > 0) {
                variationId = ft.rollout.variations[ft.rollout.variations.length - 1].variationId;
              }
              reason = 'ROLLOUT';
            } else {
              variationId = ft?.variationId ?? (variations.length > 0 ? variations[0]?.id : null);
              reason = 'FALLTHROUGH';
            }
          }
        }

        if (variationId && variations.length > 0) {
          const variation = variations.find((v: any) => v.id === variationId);
          value = variation?.value;
        }

        flags[config.flag.key] = { value, variationId, reason };
      }
    }

    res.json({ flags, env: env.key });
  } catch (error) {
    console.error('Error fetching flags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /stream — SSE stream
 */
router.get('/stream', async (req: Request, res: Response) => {
  const env = req.sdkEnvironment!;
  const client = sseManager.addClient(env.sdkKey, res);

  // Send initial flag state
  try {
    const flagConfigs = await prisma.flagEnvironmentConfig.findMany({
      where: { environmentId: env.id },
      include: {
        flag: {
          select: { key: true, type: true, variations: true, archived: true },
        },
      },
    });

    const flags: Record<string, any> = {};
    for (const config of flagConfigs) {
      if (config.flag.archived) continue;
      flags[config.flag.key] = {
        key: config.flag.key,
        type: config.flag.type,
        on: config.on,
        variations: config.flag.variations,
        offVariationId: config.offVariationId,
        fallthrough: config.fallthrough,
        targets: config.targets,
        rules: config.rules,
        version: config.version,
      };
    }

    res.write(`event: put\ndata: ${JSON.stringify({ flags })}\n\n`);
  } catch (error) {
    console.error('Error sending initial SSE flags:', error);
  }

  req.on('close', () => {
    sseManager.removeClient(env.sdkKey, client.id);
  });
});

/**
 * POST /events — Evaluation analytics (batch)
 */
router.post('/events', (req: Request, res: Response) => {
  const env = req.sdkEnvironment!;
  const { events } = req.body;

  if (!Array.isArray(events)) {
    res.status(400).json({ error: 'events must be an array' });
    return;
  }

  analyticsService.addEvents(env.sdkKey, events);
  res.status(202).json({ accepted: true });
});

/**
 * POST /track — Custom metric events
 */
router.post('/track', (req: Request, res: Response) => {
  const env = req.sdkEnvironment!;
  const { key, context, value, data } = req.body;

  if (!key) {
    res.status(400).json({ error: 'key is required' });
    return;
  }

  analyticsService.addEvents(env.sdkKey, [
    {
      kind: 'custom',
      key,
      contextKey: context?.key ?? 'anonymous',
      contextKind: context?.kind ?? 'user',
      value,
      data,
      timestamp: new Date().toISOString(),
    },
  ]);

  res.status(202).json({ accepted: true });
});

export default router;
