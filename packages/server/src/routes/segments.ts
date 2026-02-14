import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate, createSegmentSchema, updateSegmentSchema } from '../middleware/validation.js';
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
    const segments = await prisma.segment.findMany({ where: { projectId: project.id }, orderBy: { createdAt: 'desc' } });
    res.json(segments);
  } catch (err) { next(err); }
});

router.post('/', validate(createSegmentSchema), async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const segment = await prisma.segment.create({ data: { ...req.body, projectId: project.id } });
    await logAction(project.id, 'segment.create', req.user!.userId, req.user!.name, undefined, undefined, segment);
    res.status(201).json(segment);
  } catch (err) { next(err); }
});

router.get('/:segmentKey', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const segment = await prisma.segment.findFirst({ where: { projectId: project.id, key: (req.params as any).segmentKey } });
    if (!segment) { res.status(404).json({ error: 'Segment not found' }); return; }
    res.json(segment);
  } catch (err) { next(err); }
});

router.put('/:segmentKey', validate(updateSegmentSchema), async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const before = await prisma.segment.findFirst({ where: { projectId: project.id, key: (req.params as any).segmentKey } });
    if (!before) { res.status(404).json({ error: 'Segment not found' }); return; }
    const segment = await prisma.segment.update({ where: { id: before.id }, data: req.body });
    await logAction(project.id, 'segment.update', req.user!.userId, req.user!.name, undefined, before, segment);
    res.json(segment);
  } catch (err) { next(err); }
});

router.delete('/:segmentKey', async (req, res, next) => {
  try {
    const project = await getProject((req.params as any).projectKey);
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    const segment = await prisma.segment.findFirst({ where: { projectId: project.id, key: (req.params as any).segmentKey } });
    if (!segment) { res.status(404).json({ error: 'Segment not found' }); return; }
    await prisma.segment.delete({ where: { id: segment.id } });
    await logAction(project.id, 'segment.delete', req.user!.userId, req.user!.name, undefined, segment);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
