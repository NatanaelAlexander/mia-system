import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  permissionsVersion: number;
  createdAt: string;
}

export interface UserCompanySummary {
  id: string;
  name: string;
}

export interface UserDetail extends UserListItem {
  roles: string[];
  roleIds: string[];
  jobTitles: string[];
  jobTitleIds: string[];
  companies: UserCompanySummary[];
}

export interface ListUsersFilters {
  isActive?: boolean;
  roleName?: string;
  companyId?: string;
}

export function listUsers(filters: ListUsersFilters = {}) {
  const hasFilters = Object.values(filters).some((value) => value !== undefined);

  if (!hasFilters) {
    return apiFetch<UserListItem[]>("/internal/users", {}, true);
  }

  return apiFetchDetalle<UserListItem[]>("/internal/users/listar", filters, true);
}

export function getUserDetail(id: string) {
  return apiFetchDetalle<UserDetail>("/internal/users/detalle", { id }, true);
}

export interface RoleOption {
  id: string;
  name: string;
}

export function listRoleCatalog() {
  return apiFetch<RoleOption[]>("/internal/users/catalogos/roles", {}, true);
}

export function linkUserToCompany(userId: string, companyId: string) {
  return apiFetch<UserDetail>("/internal/users/vincular-empresa", {
    method: "POST",
    body: JSON.stringify({ userId, companyId }),
  }, true);
}

export function unlinkUserFromCompany(userId: string, companyId: string) {
  return apiFetch<UserDetail>("/internal/users/desvincular-empresa", {
    method: "POST",
    body: JSON.stringify({ userId, companyId }),
  }, true);
}
