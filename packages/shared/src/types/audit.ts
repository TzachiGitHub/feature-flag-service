export interface AuditLogEntry {
  id: string;
  projectId: string;
  flagKey?: string;
  action: string;
  userId: string;
  userName: string;
  before?: any;
  after?: any;
  comment?: string;
  createdAt: string;
}
