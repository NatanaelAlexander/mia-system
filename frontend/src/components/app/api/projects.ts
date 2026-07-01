import { apiFetch, apiFetchDetalle, apiUpload } from "@/lib/api/client";
import type { AssetListItem } from "./assets";
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
  updatedAt?: string;
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
  companyId?: string;
  companySearch?: string;
}

export function listProjects(
  surface: ResourceSurface,
  filters: ListProjectsFilters = {},
) {
  if (surface === "internal") {
    return apiFetchDetalle<ProjectListItem[]>(
      "/internal/projects/listar",
      {
        status: filters.status,
        companyId: filters.companyId,
        companySearch: filters.companySearch,
      },
      true,
    );
  }

  return apiFetchDetalle<ProjectListItem[]>(
    "/portal/projects/listar",
    {
      companyId: filters.companyId,
      companySearch: filters.companySearch,
    },
    true,
  );
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

export function getProjectDetail(surface: ResourceSurface, id: string) {
  const path =
    surface === "internal"
      ? "/internal/projects/detalle"
      : "/portal/projects/detalle";

  return apiFetchDetalle<ProjectListItem>(path, { id }, true);
}

export function listProjectAssets(projectId: string) {
  return apiFetchDetalle<AssetListItem[]>(
    "/internal/projects/archivos/listar",
    { projectId },
    true,
  );
}

export function uploadProjectAsset(
  projectId: string,
  file: File,
  displayName?: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("projectId", projectId);

  const trimmedName = displayName?.trim();
  if (trimmedName) {
    formData.append("displayName", trimmedName);
  }

  return apiUpload<AssetListItem>(
    "/internal/projects/subir-archivo",
    formData,
    true,
  );
}
