import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate, createFlagSchema, updateFlagSchema } from '../middleware/validation.js';
import { logAction } from '../services/audit.js';
import { invalidate as invalidateFlag } from '../services/flagStore.js';
import { broadcastFlagChange } from '../lib/broadcast.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

async function getProject(projectKey: string) {
  return prisma.project.findUnique({ where: { key: projectKey } });
}

router.get('/', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const { page = '1', limit = '20', search, tag, type, archived } = req.query as any;
    const where: any = { projectId: project.id };
    if (archived !== undefined) where.archived = archived === 'true';
    else where.archived = false;
    if (type) where.type = type;
    if (tag) where.tags = { has: tag };
    if (search) where.OR = [
      { key: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];

    const take = Math.min(parseInt(limit), 100);
    const skip = (Math.max(parseInt(page), 1) - 1) * take;

    const [flags, total] = await Promise.all([
      prisma.flag.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
      prisma.flag.count({ where }),
    ]);
    res.json({ flags, total, page: parseInt(page), limit: take });
  } catch (err) { next(err); }
});

router.post('/', validate(createFlagSchema), async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const variations = req.body.variations.map((v: any) => ({ ...v, id: v.id || uuid() }));
    const flag = await prisma.flag.create({
      data: {
        ...req.body,
        variations,
        projectId: project.id,
      },
    });

    // Create default FlagEnvironmentConfig for each environment
    const environments = await prisma.environment.findMany({ where: { projectId: project.id } });
    for (const env of environments) {
      await prisma.flagEnvironmentConfig.create({
        data: {
          flagId: flag.id,
          environmentId: env.id,
          on: false,
          fallthrough: { variationId: variations[0]?.id },
          offVariationId: variations.length > 1 ? variations[1].id : variations[0].id,
          targets: [],
          rules: [],
        },
      });
    }

    await logAction(project.id, 'flag.create', req.user!.userId, req.user!.name, flag.key, undefined, flag);
    res.status(201).json(flag);
  } catch (err) { next(err); }
});

router.get('/:flagKey', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const flag = await prisma.flag.findFirst({
      where: { projectId: project.id, key: (req.params as any).flagKey },
      include: { environmentConfigs: { include: { environment: true } } },
    });
    if (!flag) { res.status(404).json({ error: 'Flag not found' }); return; }
    res.json(flag);
  } catch (err) { next(err); }
});

router.put('/:flagKey', validate(updateFlagSchema), async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const before = await prisma.flag.findFirst({ where: { projectId: project.id, key: (req.params as any).flagKey } });
    if (!before) { res.status(404).json({ error: 'Flag not found' }); return; }
    const flag = await prisma.flag.update({ where: { id: before.id }, data: req.body });
    invalidateFlag(project.id, flag.key);
    await logAction(project.id, 'flag.update', req.user!.userId, req.user!.name, flag.key, before, flag);
    res.json(flag);
  } catch (err) { next(err); }
});

router.delete('/:flagKey', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const flag = await prisma.flag.findFirst({ where: { projectId: project.id, key: (req.params as any).flagKey } });
    if (!flag) { res.status(404).json({ error: 'Flag not found' }); return; }
    await prisma.flag.delete({ where: { id: flag.id } });
    invalidateFlag(project.id, flag.key);
    await logAction(project.id, 'flag.delete', req.user!.userId, req.user!.name, flag.key, flag);
    res.status(204).end();
  } catch (err) { next(err); }
});

router.patch('/:flagKey/archive', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const before = await prisma.flag.findFirst({ where: { projectId: project.id, key: (req.params as any).flagKey } });
    if (!before) { res.status(404).json({ error: 'Flag not found' }); return; }
    const flag = await prisma.flag.update({ where: { id: before.id }, data: { archived: !before.archived } });
    invalidateFlag(project.id, flag.key);
    await logAction(project.id, 'flag.archive', req.user!.userId, req.user!.name, flag.key, before, flag);
    res.json(flag);
  } catch (err) { next(err); }
});

/**
 * POST /evaluate — Evaluate all flags for a given context (dashboard playground)
 */
router.post('/evaluate', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const { context } = req.body;
    if (!context) { res.status(400).json({ error: 'context is required' }); return; }

    // Find the first environment (or use a query param)
    const envKey = req.query.environment as string | undefined;
    const env = envKey
      ? await prisma.environment.findFirst({ where: { projectId: project.id, key: envKey } })
      : await prisma.environment.findFirst({ where: { projectId: project.id }, orderBy: { createdAt: 'asc' } });

    if (!env) { res.status(404).json({ error: 'No environment found' }); return; }

    const flagConfigs = await prisma.flagEnvironmentConfig.findMany({
      where: { environmentId: env.id },
      include: {
        flag: {
          select: { key: true, type: true, variations: true, archived: true },
        },
      },
    });

    const results: Array<{ flagKey: string; value: any; variation: string; reason: string; details?: any }> = [];

    for (const config of flagConfigs) {
      if (config.flag.archived) continue;

      const variations = config.flag.variations as any[];
      let value: any;
      let variationId: string | null = null;
      let variationName = '';
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
              if (clause.op === 'in' || clause.op === 'eq') {
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
            const chars = Array.from(context.key || 'anonymous') as string[];
            const hash = chars.reduce((h: number, c: string) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
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
        variationName = variation?.name || variation?.id || '';
      }

      results.push({
        flagKey: config.flag.key,
        value,
        variation: variationName,
        reason,
      });
    }

    res.json({ results, environment: env.key });
  } catch (err) { next(err); }
});

export default router;
