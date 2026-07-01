import { apiFetch, apiFetchDetalle } from "@/lib/api/client";
import type { ResourceSurface } from "./types";

export type CompanyStatus = "active" | "inactive";

export interface CompanyListItem {
  id: string;
  name: string;
  taxId: string;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  status: CompanyStatus;
  createdAt: string;
}

export interface CompanyDetail extends CompanyListItem {
  representativeLinks: Array<{
    companyId: string;
    legalRepresentativeId: string;
    position: string | null;
  }>;
}

export interface CreateCompanyPayload {
  name: string;
  taxId: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  status?: CompanyStatus;
}

export interface UpdateCompanyPayload {
  name?: string;
  taxId?: string;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  status?: CompanyStatus;
}

export interface ListCompaniesFilters {
  status?: CompanyStatus;
  search?: string;
}

export function listCompanies(
  surface: ResourceSurface,
  filters: ListCompaniesFilters = {},
) {
  if (surface === "internal") {
    return apiFetchDetalle<CompanyListItem[]>(
      "/internal/companies/listar",
      {
        status: filters.status,
        search: filters.search?.trim() || undefined,
      },
      true,
    );
  }

  return apiFetch<CompanyListItem[]>(`/${surface}/companies`, {}, true);
}

export function getCompanyDetail(surface: ResourceSurface, id: string) {
  return apiFetchDetalle<CompanyDetail>(`/${surface}/companies/detalle`, { id }, true);
}

export function createCompany(payload: CreateCompanyPayload) {
  return apiFetch<CompanyListItem>("/internal/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function updateCompany(id: string, payload: UpdateCompanyPayload) {
  return apiFetch<CompanyListItem>(`/internal/companies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function deactivateCompany(id: string) {
  return apiFetch<CompanyListItem>(`/internal/companies/${id}`, {
    method: "DELETE",
  }, true);
}
