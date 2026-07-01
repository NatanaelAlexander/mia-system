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

export interface LegalRepresentative {
  id: string;
  firstName: string;
  lastName: string;
  identificationNumber: string;
  email: string | null;
  phoneNumber: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyRepresentativeLink {
  companyId: string;
  legalRepresentativeId: string;
  position: string | null;
  legalRepresentative?: LegalRepresentative;
}

export interface CompanyDetail extends CompanyListItem {
  representativeLinks: CompanyRepresentativeLink[];
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

export interface CreateLegalRepresentativePayload {
  firstName: string;
  lastName: string;
  identificationNumber: string;
  email?: string;
  phoneNumber?: string;
  userId?: string;
}

export type UpdateLegalRepresentativePayload = Partial<CreateLegalRepresentativePayload>;

export interface LinkRepresentativePayload {
  legalRepresentativeId: string;
  position?: string;
}

export interface UpdateCompanyRepresentativePayload {
  position?: string;
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

export function listLegalRepresentatives() {
  return apiFetch<LegalRepresentative[]>(
    "/internal/legal-representatives",
    {},
    true,
  );
}

export function createLegalRepresentative(
  payload: CreateLegalRepresentativePayload,
) {
  return apiFetch<LegalRepresentative>("/internal/legal-representatives", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function updateLegalRepresentative(
  id: string,
  payload: UpdateLegalRepresentativePayload,
) {
  return apiFetch<LegalRepresentative>(`/internal/legal-representatives/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function linkRepresentativeToCompany(
  companyId: string,
  payload: LinkRepresentativePayload,
) {
  return apiFetch<CompanyRepresentativeLink>(
    `/internal/companies/${companyId}/representatives`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function updateCompanyRepresentative(
  companyId: string,
  legalRepresentativeId: string,
  payload: UpdateCompanyRepresentativePayload,
) {
  return apiFetch<CompanyRepresentativeLink>(
    `/internal/companies/${companyId}/representatives/${legalRepresentativeId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function unlinkRepresentativeFromCompany(
  companyId: string,
  legalRepresentativeId: string,
) {
  return apiFetch<void>(
    `/internal/companies/${companyId}/representatives/${legalRepresentativeId}`,
    {
      method: "DELETE",
    },
    true,
  );
}
