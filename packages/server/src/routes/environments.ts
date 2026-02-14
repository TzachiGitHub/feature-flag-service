import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate, createEnvironmentSchema, updateEnvironmentSchema } from '../middleware/validation.js';
import { logAction } from '../services/audit.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

async function getProject(projectKey: string) {
  return prisma.project.findUnique({ where: { key: projectKey } });
}

router.get('/', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const envs = await prisma.environment.findMany({ where: { projectId: project.id }, orderBy: { createdAt: 'asc' } });
    res.json(envs);
  } catch (err) { next(err); }
});

router.post('/', validate(createEnvironmentSchema), async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const env = await prisma.environment.create({ data: { ...req.body, projectId: project.id } });
    await logAction(project.id, 'environment.create', req.user!.userId, req.user!.name, undefined, undefined, env);
    res.status(201).json(env);
  } catch (err) { next(err); }
});

router.put('/:envKey', validate(updateEnvironmentSchema), async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const before = await prisma.environment.findFirst({ where: { projectId: project.id, key: (req.params as any).envKey } });
    if (!before) { res.status(404).json({ error: 'Environment not found' }); return; }
    const env = await prisma.environment.update({ where: { id: before.id }, data: req.body });
    await logAction(project.id, 'environment.update', req.user!.userId, req.user!.name, undefined, before, env);
    res.json(env);
  } catch (err) { next(err); }
});

router.delete('/:envKey', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const env = await prisma.environment.findFirst({ where: { projectId: project.id, key: (req.params as any).envKey } });
    if (!env) { res.status(404).json({ error: 'Environment not found' }); return; }
    await prisma.environment.delete({ where: { id: env.id } });
    await logAction(project.id, 'environment.delete', req.user!.userId, req.user!.name, undefined, env);
    res.status(204).end();
  } catch (err) { next(err); }
});

router.post('/:envKey/rotate-key', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const env = await prisma.environment.findFirst({ where: { projectId: project.id, key: (req.params as any).envKey } });
    if (!env) { res.status(404).json({ error: 'Environment not found' }); return; }
    const updated = await prisma.environment.update({
      where: { id: env.id },
      data: { sdkKey: uuid(), sdkKeyServer: uuid() },
    });
    await logAction(project.id, 'environment.rotate-key', req.user!.userId, req.user!.name, undefined, env, updated);
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;
