import { apiFetch, apiFetchDetalle } from "@/lib/api/client";
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

export interface ListTicketsFilters {
  projectId?: string;
}

export function listTickets(
  surface: ResourceSurface,
  filters: ListTicketsFilters = {},
) {
  if (surface === "internal") {
    return apiFetchDetalle<TicketListItem[]>(
      "/internal/tickets/listar",
      {
        projectId: filters.projectId,
      },
      true,
    );
  }

  return apiFetchDetalle<TicketListItem[]>(
    "/portal/tickets/listar",
    {
      projectId: filters.projectId,
    },
    true,
  );
}
