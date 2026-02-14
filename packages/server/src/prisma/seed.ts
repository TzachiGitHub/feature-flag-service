import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const password = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password,
      role: 'ADMIN',
    },
  });
  console.log('Created user:', user.email);

  // Create default project
  const project = await prisma.project.upsert({
    where: { key: 'default' },
    update: {},
    create: {
      name: 'Default',
      key: 'default',
      description: 'Default project',
    },
  });
  console.log('Created project:', project.key);

  // Create environments
  const envData = [
    { name: 'Development', key: 'dev', color: '#4CAF50' },
    { name: 'Staging', key: 'staging', color: '#FF9800' },
    { name: 'Production', key: 'production', color: '#F44336' },
  ];

  const environments = [];
  for (const e of envData) {
    const env = await prisma.environment.upsert({
      where: { projectId_key: { projectId: project.id, key: e.key } },
      update: {},
      create: { ...e, projectId: project.id },
    });
    environments.push(env);
    console.log('Created environment:', env.key);
  }

  // Sample flags
  const flags = [
    {
      key: 'dark-mode',
      name: 'Dark Mode',
      type: 'BOOLEAN' as const,
      tags: ['ui', 'theme'],
      variations: [
        { id: uuid(), value: true, name: 'Enabled' },
        { id: uuid(), value: false, name: 'Disabled' },
      ],
    },
    {
      key: 'welcome-message',
      name: 'Welcome Message',
      type: 'STRING' as const,
      tags: ['ui', 'copy'],
      variations: [
        { id: uuid(), value: 'Welcome!', name: 'Default' },
        { id: uuid(), value: 'Hello there!', name: 'Friendly' },
        { id: uuid(), value: 'Welcome back!', name: 'Returning' },
      ],
    },
    {
      key: 'feature-limits',
      name: 'Feature Limits',
      type: 'JSON' as const,
      tags: ['billing'],
      variations: [
        { id: uuid(), value: { maxItems: 10, maxUsers: 5 }, name: 'Free' },
        { id: uuid(), value: { maxItems: 100, maxUsers: 50 }, name: 'Pro' },
      ],
    },
  ];

  for (const f of flags) {
    const existing = await prisma.flag.findFirst({ where: { projectId: project.id, key: f.key } });
    if (existing) { console.log('Flag exists:', f.key); continue; }

    const flag = await prisma.flag.create({
      data: {
        key: f.key,
        name: f.name,
        type: f.type,
        tags: f.tags,
        variations: f.variations,
        projectId: project.id,
      },
    });

    for (const env of environments) {
      await prisma.flagEnvironmentConfig.create({
        data: {
          flagId: flag.id,
          environmentId: env.id,
          on: env.key === 'dev',
          fallthrough: { variationId: f.variations[0].id },
          offVariationId: f.variations[f.variations.length - 1].id,
          targets: [],
          rules: [],
        },
      });
    }
    console.log('Created flag:', f.key);
  }

  console.log('✅ Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
