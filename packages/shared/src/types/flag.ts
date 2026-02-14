export type FlagType = 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';

export interface Variation {
  id: string;
  value: any;
  name: string;
  description?: string;
}

export interface Flag {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: FlagType;
  tags: string[];
  temporary: boolean;
  archived: boolean;
  projectId: string;
  variations: Variation[];
  createdAt: string;
  updatedAt: string;
}
