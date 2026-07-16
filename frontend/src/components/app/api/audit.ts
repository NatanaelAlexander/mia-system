import { apiFetchDetalle } from "@/lib/api/client";

export interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListAuditLogsFilters {
  action?: string;
  userId?: string;
  tableName?: string;
  recordId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function listAuditLogs(filters: ListAuditLogsFilters = {}) {
  return apiFetchDetalle<PaginatedAuditLogs>(
    "/internal/audit-logs/listar",
    {
      action: filters.action || undefined,
      userId: filters.userId || undefined,
      tableName: filters.tableName || undefined,
      recordId: filters.recordId || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    },
    true,
  );
}
