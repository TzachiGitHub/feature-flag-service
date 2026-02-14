import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      sdkEnvironment?: {
        id: string;
        key: string;
        name: string;
        sdkKey: string;
        sdkKeyServer: string;
        projectId: string;
      };
      sdkProject?: {
        id: string;
        key: string;
        name: string;
      };
    }
  }
}

export async function sdkAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sdkKey = req.headers.authorization;

  if (!sdkKey) {
    res.status(401).json({ error: 'SDK key required in Authorization header' });
    return;
  }

  try {
    const environment = await prisma.environment.findFirst({
      where: {
        OR: [{ sdkKey }, { sdkKeyServer: sdkKey }],
      },
      include: {
        project: { select: { id: true, key: true, name: true } },
      },
    });

    if (!environment) {
      res.status(401).json({ error: 'Invalid SDK key' });
      return;
    }

    req.sdkEnvironment = {
      id: environment.id,
      key: environment.key,
      name: environment.name,
      sdkKey: environment.sdkKey,
      sdkKeyServer: environment.sdkKeyServer,
      projectId: environment.projectId,
    };
    req.sdkProject = environment.project;

    next();
  } catch (error) {
    console.error('SDK auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
