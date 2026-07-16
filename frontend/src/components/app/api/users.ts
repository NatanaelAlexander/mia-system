import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  permissionsVersion: number;
  createdAt: string;
  jobTitles?: string[];
  jobTitleIds?: string[];
}

export interface UserCompanySummary {
  id: string;
  name: string;
}

export interface UserDetail extends UserListItem {
  phoneNumber: string | null;
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

export interface RoleOption {
  id: string;
  name: string;
}

export interface JobTitleOption {
  id: string;
  name: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive?: boolean;
  roleIds?: string[];
  jobTitleIds?: string[];
  companyIds?: string[];
}

export interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  isActive?: boolean;
  jobTitleIds?: string[];
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

export function listRoleCatalog() {
  return apiFetch<RoleOption[]>("/internal/users/catalogos/roles", {}, true);
}

export function listJobTitleCatalog() {
  return apiFetch<JobTitleOption[]>("/internal/users/catalogos/cargos", {}, true);
}

export function createUser(payload: CreateUserPayload) {
  return apiFetch<UserDetail>("/internal/users", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return apiFetch<UserDetail>(`/internal/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function assignUserRoles(id: string, roleIds: string[]) {
  return apiFetch<UserDetail>(`/internal/users/${id}/roles`, {
    method: "PATCH",
    body: JSON.stringify({ roleIds }),
  }, true);
}

export function deactivateUser(id: string) {
  return apiFetch<UserListItem>(`/internal/users/${id}`, {
    method: "DELETE",
  }, true);
}

export function adminChangeUserPassword(id: string, password: string) {
  return apiFetch<{ ok: boolean }>(`/internal/users/${id}/contrasena`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  }, true);
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
