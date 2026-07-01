import { apiFetch } from "@/lib/api/client";
import type { ResourceSurface } from "./types";

export interface CompanyListItem {
  id: string;
  name: string;
  taxId: string;
  email: string | null;
  status: string;
  createdAt: string;
}

export function listCompanies(surface: ResourceSurface) {
  return apiFetch<CompanyListItem[]>(`/${surface}/companies`, {}, true);
}
