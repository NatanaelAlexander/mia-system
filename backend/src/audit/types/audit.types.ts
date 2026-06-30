/** Acciones habituales; en BD es VARCHAR libre. */
export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  SOFT_DELETE: 'soft_delete',
  ASSIGN: 'assign',
  STATUS_CHANGE: 'status_change',
  PERMISSION_CHANGE: 'permission_change',
} as const;

export type AuditActionType =
  (typeof AuditAction)[keyof typeof AuditAction];

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: Date;
}

/** Entrada para registrar auditoría (otros módulos llamarán esto después). */
export interface CreateAuditLogInput {
  userId?: string | null;
  action: string;
  tableName: string;
  recordId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

export interface AuditLogFilters {
  tableName?: string;
  recordId?: string;
  userId?: string;
  action?: string;
  limit?: number;
}
