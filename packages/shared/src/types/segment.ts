import type { TargetingRule } from './targeting.js';

export interface Segment {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectId: string;
  rules: TargetingRule[];
  included: string[];
  excluded: string[];
  createdAt: string;
  updatedAt: string;
}
