import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate, createProjectSchema, updateProjectSchema } from '../middleware/validation.js';
import { logAction } from '../services/audit.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res, next) => {
  try {
    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(projects);
  } catch (err) { next(err); }
});

router.post('/', validate(createProjectSchema), async (req, res, next) => {
  try {
    const project = await prisma.project.create({ data: req.body });
    await logAction(project.id, 'project.create', req.user!.userId, req.user!.name, undefined, undefined, project);
    res.status(201).json(project);
  } catch (err) { next(err); }
});

router.get('/:key', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { key: req.params.key }, include: { environments: true } });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    res.json(project);
  } catch (err) { next(err); }
});

router.put('/:key', validate(updateProjectSchema), async (req, res, next) => {
  try {
    const before = await prisma.project.findUnique({ where: { key: req.params.key } });
    if (!before) { res.status(404).json({ error: 'Project not found' }); return; }
    const project = await prisma.project.update({ where: { key: req.params.key }, data: req.body });
    await logAction(project.id, 'project.update', req.user!.userId, req.user!.name, undefined, before, project);
    res.json(project);
  } catch (err) { next(err); }
});

router.delete('/:key', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { key: req.params.key } });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    await prisma.project.delete({ where: { key: req.params.key } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
