export interface Flag {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: string;
  tags: string[];
  archived: boolean;
  variations: Variation[];
  createdAt: string;
  updatedAt: string;
}

export interface Variation {
  id: string;
  value: any;
  name: string;
  description?: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
}

export interface Environment {
  id: string;
  key: string;
  name: string;
  color: string;
  sdkKey: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
