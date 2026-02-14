import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate, updateTargetingSchema, toggleFlagSchema } from '../middleware/validation.js';
import { logAction } from '../services/audit.js';
import { invalidate as invalidateFlag } from '../services/flagStore.js';
import { broadcastFlagChange } from '../lib/broadcast.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

async function getProject(projectKey: string) {
  return prisma.project.findUnique({ where: { key: projectKey } });
}

router.get('/:flagKey/environments/:envKey', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const flag = await prisma.flag.findFirst({ where: { projectId: project.id, key: (req.params as any).flagKey } });
    if (!flag) { res.status(404).json({ error: 'Flag not found' }); return; }
    const env = await prisma.environment.findFirst({ where: { projectId: project.id, key: (req.params as any).envKey } });
    if (!env) { res.status(404).json({ error: 'Environment not found' }); return; }

    const config = await prisma.flagEnvironmentConfig.findUnique({
      where: { flagId_environmentId: { flagId: flag.id, environmentId: env.id } },
    });
    if (!config) { res.status(404).json({ error: 'Config not found' }); return; }
    res.json(config);
  } catch (err) { next(err); }
});

router.patch('/:flagKey/environments/:envKey', validate(updateTargetingSchema), async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const flag = await prisma.flag.findFirst({ where: { projectId: project.id, key: (req.params as any).flagKey } });
    if (!flag) { res.status(404).json({ error: 'Flag not found' }); return; }
    const env = await prisma.environment.findFirst({ where: { projectId: project.id, key: (req.params as any).envKey } });
    if (!env) { res.status(404).json({ error: 'Environment not found' }); return; }

    const before = await prisma.flagEnvironmentConfig.findUnique({
      where: { flagId_environmentId: { flagId: flag.id, environmentId: env.id } },
    });
    if (!before) { res.status(404).json({ error: 'Config not found' }); return; }

    const config = await prisma.flagEnvironmentConfig.update({
      where: { id: before.id },
      data: { ...req.body, version: { increment: 1 } },
    });

    invalidateFlag(project.id, flag.key);
    broadcastFlagChange(env.id, flag.key);
    await logAction(project.id, 'targeting.update', req.user!.userId, req.user!.name, flag.key, before, config);
    res.json(config);
  } catch (err) { next(err); }
});

router.post('/toggle', validate(toggleFlagSchema), async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const { flagKey, environmentKey, on } = req.body;
    const flag = await prisma.flag.findFirst({ where: { projectId: project.id, key: flagKey } });
    if (!flag) { res.status(404).json({ error: 'Flag not found' }); return; }
    const env = await prisma.environment.findFirst({ where: { projectId: project.id, key: environmentKey } });
    if (!env) { res.status(404).json({ error: 'Environment not found' }); return; }

    const before = await prisma.flagEnvironmentConfig.findUnique({
      where: { flagId_environmentId: { flagId: flag.id, environmentId: env.id } },
    });
    if (!before) { res.status(404).json({ error: 'Config not found' }); return; }

    const config = await prisma.flagEnvironmentConfig.update({
      where: { id: before.id },
      data: { on, version: { increment: 1 } },
    });

    invalidateFlag(project.id, flag.key);
    broadcastFlagChange(env.id, flag.key);
    await logAction(project.id, 'flag.toggle', req.user!.userId, req.user!.name, flagKey, { on: before.on }, { on });
    res.json(config);
  } catch (err) { next(err); }
});

export default router;
