import { apiFetch, apiFetchDetalle } from "@/lib/api/client";

export interface JobTitleListItem {
  id: string;
  name: string;
  userCount: number;
}

export interface JobTitleOption {
  id: string;
  name: string;
}

export function listJobTitlesAdmin() {
  return apiFetchDetalle<JobTitleListItem[]>(
    "/internal/users/catalogos/cargos/listar",
    {},
    true,
  );
}

export function createJobTitle(name: string) {
  return apiFetch<JobTitleOption>("/internal/users/catalogos/cargos", {
    method: "POST",
    body: JSON.stringify({ name }),
  }, true);
}

export function updateJobTitle(id: string, name: string) {
  return apiFetch<JobTitleOption>(`/internal/users/catalogos/cargos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  }, true);
}

export function deleteJobTitle(id: string) {
  return apiFetch<JobTitleOption>(`/internal/users/catalogos/cargos/${id}`, {
    method: "DELETE",
  }, true);
}
