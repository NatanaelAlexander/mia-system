import { apiFetch } from "@/lib/api/client";
import type { ResourceSurface } from "./types";

export interface ProfileDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  permissionsVersion: number;
  roles: string[];
}

export interface UpdateProfilePayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function getProfile(surface: ResourceSurface) {
  return apiFetch<ProfileDetail>(`/${surface}/users/perfil`, {}, true);
}

export function updateProfile(
  surface: ResourceSurface,
  payload: UpdateProfilePayload,
) {
  return apiFetch<ProfileDetail>(`/${surface}/users/perfil`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function changePassword(
  surface: ResourceSurface,
  payload: ChangePasswordPayload,
) {
  return apiFetch<{ ok: true }>(`/${surface}/users/perfil/contrasena`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}
