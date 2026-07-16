import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { AuditLogNoEncontradoException } from './exceptions/audit.exceptions';
import {
  SQL_COUNT_AUDIT_LOGS_BASE,
  SQL_FIND_ALL_AUDIT_LOGS_BASE,
  SQL_FIND_AUDIT_LOG_BY_ID,
  SQL_INSERT_AUDIT_LOG,
} from './queries/audit.queries';
import {
  AuditLog,
  AuditLogFilters,
  CreateAuditLogInput,
  PaginatedAuditLogs,
} from './types/audit.types';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Registrar una acción en audit_logs.
   * Otros módulos (companies, projects, tickets…) llamarán esto cuando conectemos auth.
   */
  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    const { rows } = await this.db.query<AuditLog>(SQL_INSERT_AUDIT_LOG, [
      input.userId ?? null,
      input.action,
      input.tableName,
      input.recordId ?? null,
      input.oldValues ?? null,
      input.newValues ?? null,
    ]);

    return rows[0];
  }

  async findAll(filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    const { where, params } = this.buildFilters(filters);

    const countResult = await this.db.query<{ total: number }>(
      `${SQL_COUNT_AUDIT_LOGS_BASE} ${where}`,
      params,
    );
    const total = countResult.rows[0]?.total ?? 0;

    const dataSql = `${SQL_FIND_ALL_AUDIT_LOGS_BASE}
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}`;

    const { rows } = await this.db.query<AuditLog>(dataSql, [
      ...params,
      pageSize,
      offset,
    ]);

    return { items: rows, total, page, pageSize };
  }

  async findById(id: string): Promise<AuditLog> {
    const { rows } = await this.db.query<AuditLog>(SQL_FIND_AUDIT_LOG_BY_ID, [
      id,
    ]);

    if (!rows[0]) {
      throw new AuditLogNoEncontradoException();
    }

    return rows[0];
  }

  private buildFilters(filters: AuditLogFilters): {
    where: string;
    params: unknown[];
  } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (filters.tableName) {
      conditions.push(`table_name = $${index++}`);
      params.push(filters.tableName);
    }

    if (filters.recordId) {
      conditions.push(`record_id = $${index++}`);
      params.push(filters.recordId);
    }

    if (filters.userId) {
      conditions.push(`user_id = $${index++}`);
      params.push(filters.userId);
    }

    if (filters.action) {
      conditions.push(`action = $${index++}`);
      params.push(filters.action);
    }

    if (filters.dateFrom) {
      conditions.push(`created_at >= $${index++}`);
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`created_at <= $${index++}`);
      params.push(filters.dateTo);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { where, params };
  }
}
