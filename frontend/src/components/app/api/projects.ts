import { apiFetch, apiFetchDetalle } from "@/lib/api/client";
import type { ResourceSurface } from "./types";

export type ProjectType = "internal" | "external";
export type ProjectStatus = "active" | "inactive" | "completed";

export interface ProjectListItem {
  id: string;
  companyId: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  createdAt: string;
}

export interface CreateProjectPayload {
  companyId: string;
  name: string;
  type: ProjectType;
}

export interface UpdateProjectPayload {
  name?: string;
  type?: ProjectType;
  status?: ProjectStatus;
}

export interface ListProjectsFilters {
  status?: ProjectStatus;
}

export function listProjects(
  surface: ResourceSurface,
  filters: ListProjectsFilters = {},
) {
  if (surface === "internal") {
    return apiFetchDetalle<ProjectListItem[]>(
      "/internal/projects/listar",
      { status: filters.status },
      true,
    );
  }

  return apiFetch<ProjectListItem[]>(`/${surface}/projects`, {}, true);
}

export function createProject(payload: CreateProjectPayload) {
  return apiFetch<ProjectListItem>("/internal/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function updateProject(id: string, payload: UpdateProjectPayload) {
  return apiFetch<ProjectListItem>(`/internal/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}
