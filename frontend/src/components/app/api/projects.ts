import { apiFetch } from "@/lib/api/client";
import type { ResourceSurface } from "./types";

export interface ProjectListItem {
  id: string;
  companyId: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
}

export function listProjects(surface: ResourceSurface) {
  return apiFetch<ProjectListItem[]>(`/${surface}/projects`, {}, true);
}
