import { apiFetch } from "@/lib/api/client";
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

export function listProjects(surface: ResourceSurface) {
  return apiFetch<ProjectListItem[]>(`/${surface}/projects`, {}, true);
}

export function createProject(payload: CreateProjectPayload) {
  return apiFetch<ProjectListItem>("/internal/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}
