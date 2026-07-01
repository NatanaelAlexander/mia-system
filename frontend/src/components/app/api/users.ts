import { apiFetch } from "@/lib/api/client";

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
  return apiFetch<UserListItem[]>("/internal/users", {
    method: "GET",
    body: JSON.stringify(filters),
  }, true);
}

export function getUserDetail(id: string) {
  return apiFetch<UserDetail>("/internal/users/detalle", {
    method: "GET",
    body: JSON.stringify({ id }),
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
