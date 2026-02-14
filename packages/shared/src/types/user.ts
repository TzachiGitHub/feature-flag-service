export type Role = 'OWNER' | 'ADMIN' | 'WRITER' | 'READER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}
