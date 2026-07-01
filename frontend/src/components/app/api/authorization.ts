import { apiFetch } from "@/lib/api/client";

export interface PermissionItem {
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

export function listPermissions() {
  return apiFetch<PermissionItem[]>(
    "/internal/admin/authorization/permissions",
    {},
    true,
  );
}

export function verifyAuthorizationHealth() {
  return apiFetch<AuthorizationHealthReport>(
    "/internal/admin/authorization/verify",
    {},
    true,
  );
}
