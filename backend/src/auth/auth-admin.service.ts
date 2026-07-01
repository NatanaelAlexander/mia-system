import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import {
  SQL_ADMIN_ROLE_PERMISSION_COUNT,
  SQL_COUNT_PERMISSIONS,
  SQL_COUNT_ROLES,
  SQL_COUNT_USERS_WITHOUT_PERMISSIONS,
  SQL_COUNT_USERS_WITHOUT_ROLES,
  SQL_LIST_PERMISSIONS,
  SQL_SUPER_ADMIN_ROLE_PERMISSION_COUNT,
} from './queries/auth-admin.queries';

export interface PermissionRecord {
  id: string;
  name: string;
  module: string;
}

export interface AuthorizationHealthReport {
  roles: number;
  permissions: number;
  usersWithoutRoles: number;
  usersWithoutPermissions: number;
  adminRolePermissionCount: number;
  superAdminRolePermissionCount: number;
  healthy: boolean;
  warnings: string[];
}

@Injectable()
export class AuthAdminService {
  constructor(private readonly db: DatabaseService) {}

  async verifyAuthorizationHealth(): Promise<AuthorizationHealthReport> {
    const [
      roles,
      permissions,
      usersWithoutRoles,
      usersWithoutPermissions,
      adminRolePermissionCount,
      superAdminRolePermissionCount,
    ] = await Promise.all([
      this.scalar(SQL_COUNT_ROLES),
      this.scalar(SQL_COUNT_PERMISSIONS),
      this.scalar(SQL_COUNT_USERS_WITHOUT_ROLES),
      this.scalar(SQL_COUNT_USERS_WITHOUT_PERMISSIONS),
      this.scalar(SQL_ADMIN_ROLE_PERMISSION_COUNT),
      this.scalar(SQL_SUPER_ADMIN_ROLE_PERMISSION_COUNT),
    ]);

    const warnings: string[] = [];

    if (usersWithoutRoles > 0) {
      warnings.push(`${usersWithoutRoles} usuario(s) activo(s) sin rol asignado`);
    }

    if (usersWithoutPermissions > 0) {
      warnings.push(
        `${usersWithoutPermissions} usuario(s) activo(s) sin permisos efectivos`,
      );
    }

    if (adminRolePermissionCount === 0) {
      warnings.push('El rol admin no tiene permisos asignados');
    }

    if (superAdminRolePermissionCount === 0) {
      warnings.push('El rol super_admin no tiene permisos asignados');
    }

    return {
      roles,
      permissions,
      usersWithoutRoles,
      usersWithoutPermissions,
      adminRolePermissionCount,
      superAdminRolePermissionCount,
      healthy: warnings.length === 0,
      warnings,
    };
  }

  async listPermissions(): Promise<PermissionRecord[]> {
    const { rows } = await this.db.query<PermissionRecord>(SQL_LIST_PERMISSIONS);
    return rows;
  }

  private async scalar(sql: string): Promise<number> {
    const { rows } = await this.db.query<{ count: number }>(sql);
    return rows[0]?.count ?? 0;
  }
}
