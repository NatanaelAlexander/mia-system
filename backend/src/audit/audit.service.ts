import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { AuditLogNoEncontradoException } from './exceptions/audit.exceptions';
import {
  SQL_FIND_ALL_AUDIT_LOGS_BASE,
  SQL_FIND_AUDIT_LOG_BY_ID,
  SQL_INSERT_AUDIT_LOG,
} from './queries/audit.queries';
import {
  AuditLog,
  AuditLogFilters,
  CreateAuditLogInput,
} from './types/audit.types';

const DEFAULT_LIST_LIMIT = 50;

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

  async findAll(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    const { sql, params } = this.buildListQuery(filters);
    const { rows } = await this.db.query<AuditLog>(sql, params);
    return rows;
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

  private buildListQuery(filters: AuditLogFilters): {
    sql: string;
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

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const limit = filters.limit ?? DEFAULT_LIST_LIMIT;
    params.push(limit);

    const sql = `${SQL_FIND_ALL_AUDIT_LOGS_BASE}
      ${where}
      ORDER BY created_at DESC
      LIMIT $${index}`;

    return { sql, params };
  }
}
