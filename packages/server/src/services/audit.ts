import { prisma } from '../lib/prisma.js';

export async function logAction(
  projectId: string,
  action: string,
  userId: string,
  userName: string,
  flagKey?: string,
  before?: any,
  after?: any,
  comment?: string,
) {
  return prisma.auditLogEntry.create({
    data: { projectId, action, userId, userName, flagKey, before, after, comment },
  });
}

export async function getAuditLog(
  projectId: string,
  filters: {
    flagKey?: string;
    userId?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  },
) {
  const where: any = { projectId };
  if (filters.flagKey) where.flagKey = filters.flagKey;
  if (filters.userId) where.userId = filters.userId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(filters.to);
  }

  const [entries, total] = await Promise.all([
    prisma.auditLogEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.auditLogEntry.count({ where }),
  ]);

  return { entries, total };
}
