import { prisma } from '../lib/prisma.js';

interface CachedFlagConfig {
  flag: any;
  configs: Map<string, any>;
}

const cache = new Map<string, CachedFlagConfig>(); // key: `${projectId}:${flagKey}`
let allLoaded = false;

function cacheKey(projectId: string, flagKey: string) {
  return `${projectId}:${flagKey}`;
}

export async function getFlag(projectId: string, flagKey: string) {
  const key = cacheKey(projectId, flagKey);
  if (cache.has(key)) return cache.get(key)!;

  const flag = await prisma.flag.findFirst({
    where: { projectId, key: flagKey },
    include: { environmentConfigs: true },
  });
  if (!flag) return null;

  const configs = new Map<string, any>();
  for (const c of flag.environmentConfigs) {
    configs.set(c.environmentId, c);
  }
  const entry = { flag, configs };
  cache.set(key, entry);
  return entry;
}

export async function getFlagsForEnvironment(environmentId: string) {
  const configs = await prisma.flagEnvironmentConfig.findMany({
    where: { environmentId },
    include: { flag: true },
  });
  return configs;
}

export function invalidate(projectId: string, flagKey: string) {
  cache.delete(cacheKey(projectId, flagKey));
}

export function invalidateAll() {
  cache.clear();
  allLoaded = false;
}
