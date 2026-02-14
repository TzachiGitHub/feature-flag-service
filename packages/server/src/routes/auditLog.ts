import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { getAuditLog } from '../services/audit.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { key: (req.params as any).projectKey } });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const { flagKey, userId, from, to, limit, offset } = req.query as any;
    const result = await getAuditLog(project.id, {
      flagKey,
      userId,
      from,
      to,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
