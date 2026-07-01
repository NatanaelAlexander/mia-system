import { apiFetch } from "@/lib/api/client";
import type { ResourceSurface } from "./types";

export interface TicketListItem {
  id: string;
  title: string;
  statusName: string;
  priorityName: string;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
}

export function listTickets(surface: ResourceSurface) {
  return apiFetch<TicketListItem[]>(`/${surface}/tickets`, {}, true);
}
