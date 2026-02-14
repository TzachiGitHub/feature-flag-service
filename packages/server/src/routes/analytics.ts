import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { analyticsService } from '../services/analytics.js';

const router = Router({ mergeParams: true });

/**
 * GET /evaluations — Evaluation counts
 * Query: ?flagKey, ?period (1h/24h/7d/30d)
 */
router.get('/evaluations', async (req: Request, res: Response) => {
  try {
    const projectKey = req.params.projectKey ?? req.params.key;
    const project = await prisma.project.findUnique({
      where: { key: projectKey },
      select: { id: true },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const results = await analyticsService.getEvaluationCounts(project.id, {
      flagKey: req.query.flagKey as string | undefined,
      period: (req.query.period as any) ?? '24h',
    });

    res.json({ evaluations: results });
  } catch (error) {
    console.error('Analytics evaluations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /evaluations/:flagKey/breakdown — Variation breakdown
 */
router.get('/evaluations/:flagKey/breakdown', async (req: Request, res: Response) => {
  try {
    const projectKey = req.params.projectKey ?? req.params.key;
    const project = await prisma.project.findUnique({
      where: { key: projectKey },
      select: { id: true },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const results = await analyticsService.getVariationBreakdown(
      project.id,
      req.params.flagKey,
      req.query.period as string | undefined
    );

    res.json({ breakdown: results });
  } catch (error) {
    console.error('Analytics breakdown error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /stale-flags — Flags not evaluated recently
 * Query: ?days (default 7)
 */
router.get('/stale-flags', async (req: Request, res: Response) => {
  try {
    const projectKey = req.params.projectKey ?? req.params.key;
    const project = await prisma.project.findUnique({
      where: { key: projectKey },
      select: { id: true },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const days = parseInt(req.query.days as string) || 7;
    const staleFlags = await analyticsService.getStaleFlags(project.id, days);

    res.json({ staleFlags, days });
  } catch (error) {
    console.error('Analytics stale flags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
