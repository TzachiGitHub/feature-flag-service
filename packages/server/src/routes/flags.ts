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

export default router;
