import { apiFetch } from "@/lib/api/client";

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  permissionsVersion: number;
  createdAt: string;
}

export function listUsers() {
  return apiFetch<UserListItem[]>("/internal/users", {}, true);
}
