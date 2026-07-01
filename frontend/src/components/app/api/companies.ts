import { apiFetch } from "@/lib/api/client";
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

export function listCompanies(surface: ResourceSurface) {
  return apiFetch<CompanyListItem[]>(`/${surface}/companies`, {}, true);
}

export function getCompanyDetail(surface: ResourceSurface, id: string) {
  return apiFetch<CompanyDetail>(`/${surface}/companies/detalle`, {
    method: "GET",
    body: JSON.stringify({ id }),
  }, true);
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
