import { apiFetch } from "@/lib/api/client";
import type { ResourceSurface } from "./types";

export interface ProfileItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  permissionsVersion: number;
}

export function getProfile(surface: ResourceSurface) {
  return apiFetch<ProfileItem>(`/${surface}/users/perfil`, {}, true);
}
