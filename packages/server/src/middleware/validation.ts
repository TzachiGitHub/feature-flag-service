import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}

// --- Schemas ---

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['OWNER', 'ADMIN', 'WRITER', 'READER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const createEnvironmentSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).regex(/^[a-z0-9-]+$/),
  color: z.string().optional(),
});

export const updateEnvironmentSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
});

const variationSchema = z.object({
  id: z.string().optional(),
  value: z.any(),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const createFlagSchema = z.object({
  key: z.string().min(1).regex(/^[a-zA-Z0-9._-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['BOOLEAN', 'STRING', 'NUMBER', 'JSON']).default('BOOLEAN'),
  tags: z.array(z.string()).default([]),
  temporary: z.boolean().default(false),
  variations: z.array(variationSchema).min(2),
});

export const updateFlagSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  temporary: z.boolean().optional(),
  archived: z.boolean().optional(),
  variations: z.array(variationSchema).min(2).optional(),
});

const clauseSchema = z.object({
  attribute: z.string(),
  op: z.enum([
    'eq', 'neq', 'contains', 'startsWith', 'endsWith',
    'in', 'matches', 'gt', 'lt', 'gte', 'lte',
    'semverEq', 'semverGt', 'semverLt',
  ]),
  values: z.array(z.any()),
  negate: z.boolean().optional(),
  contextKind: z.string().optional(),
});

const weightedVariationSchema = z.object({
  variationId: z.string(),
  weight: z.number().min(0).max(100000),
});

const rolloutSchema = z.object({
  variations: z.array(weightedVariationSchema),
  bucketBy: z.string().optional(),
});

const ruleSchema = z.object({
  id: z.string().optional(),
  clauses: z.array(clauseSchema),
  variationId: z.string().optional(),
  rollout: rolloutSchema.optional(),
  description: z.string().optional(),
  ref: z.string().optional(),
});

const individualTargetSchema = z.object({
  contextKind: z.string(),
  variationId: z.string(),
  values: z.array(z.string()),
});

const fallthroughSchema = z.object({
  variationId: z.string().optional(),
  rollout: rolloutSchema.optional(),
});

export const updateTargetingSchema = z.object({
  on: z.boolean().optional(),
  offVariationId: z.string().optional(),
  fallthrough: fallthroughSchema.optional(),
  targets: z.array(individualTargetSchema).optional(),
  rules: z.array(ruleSchema).optional(),
});

export const toggleFlagSchema = z.object({
  flagKey: z.string(),
  environmentKey: z.string(),
  on: z.boolean(),
});

export const createSegmentSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  rules: z.array(ruleSchema).default([]),
  included: z.array(z.string()).default([]),
  excluded: z.array(z.string()).default([]),
});

export const updateSegmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  rules: z.array(ruleSchema).optional(),
  included: z.array(z.string()).optional(),
  excluded: z.array(z.string()).optional(),
});
