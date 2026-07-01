import { apiFetch, apiFetchDetalle, apiUpload } from "@/lib/api/client";
import type { AssetListItem } from "./assets";
import type { ResourceSurface } from "./types";

export interface TicketCatalogItem {
  id: string;
  name: string;
}

export interface TicketListItem {
  id: string;
  title: string;
  statusName: string;
  priorityName: string;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends TicketListItem {
  projectId: string;
  userId: string;
  description: string | null;
  statusId: string;
  priorityId: string;
  categoryId: string | null;
  paymentStatusId: string | null;
  paymentStatusName: string | null;
  assignedToId: string | null;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  authorFirstName: string;
  authorLastName: string;
  authorJobTitles: string[];
}

export interface ListTicketsFilters {
  projectId?: string;
}

export interface CreateTicketPayload {
  projectId: string;
  title: string;
  description?: string;
  priorityId: string;
  categoryId?: string;
  paymentStatusId?: string;
  assignedToId?: string;
}

export interface AddTicketCommentPayload {
  ticketId: string;
  comment: string;
  isInternal?: boolean;
}

function ticketsBase(surface: ResourceSurface) {
  return surface === "internal" ? "/internal/tickets" : "/portal/tickets";
}

export function listTickets(
  surface: ResourceSurface,
  filters: ListTicketsFilters = {},
) {
  return apiFetchDetalle<TicketListItem[]>(
    `${ticketsBase(surface)}/listar`,
    { projectId: filters.projectId },
    true,
  );
}

export function getTicketDetail(surface: ResourceSurface, id: string) {
  return apiFetchDetalle<TicketDetail>(
    `${ticketsBase(surface)}/detalle`,
    { id },
    true,
  );
}

export function createTicket(
  surface: ResourceSurface,
  payload: CreateTicketPayload,
) {
  return apiFetch<TicketDetail>(ticketsBase(surface), {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function listTicketComments(surface: ResourceSurface, ticketId: string) {
  return apiFetchDetalle<TicketComment[]>(
    `${ticketsBase(surface)}/comentarios/listar`,
    { ticketId },
    true,
  );
}

export function addTicketComment(
  surface: ResourceSurface,
  payload: AddTicketCommentPayload,
) {
  const body =
    surface === "internal"
      ? payload
      : { ticketId: payload.ticketId, comment: payload.comment };

  return apiFetch<TicketComment>(`${ticketsBase(surface)}/comentarios`, {
    method: "POST",
    body: JSON.stringify(body),
  }, true);
}

export function listTicketCommentAssets(
  surface: ResourceSurface,
  ticketCommentId: string,
) {
  return apiFetchDetalle<AssetListItem[]>(
    `${ticketsBase(surface)}/comentarios/archivos/listar`,
    { ticketCommentId },
    true,
  );
}

export function uploadTicketCommentAsset(
  surface: ResourceSurface,
  ticketCommentId: string,
  file: File,
  displayName?: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ticketCommentId", ticketCommentId);

  const trimmedName = displayName?.trim();
  if (trimmedName) {
    formData.append("displayName", trimmedName);
  }

  return apiUpload<AssetListItem>(
    `${ticketsBase(surface)}/comentarios/subir-archivo`,
    formData,
    true,
  );
}

export function listTicketAssets(surface: ResourceSurface, ticketId: string) {
  return apiFetchDetalle<AssetListItem[]>(
    `${ticketsBase(surface)}/archivos/listar`,
    { ticketId },
    true,
  );
}

export function uploadTicketAsset(
  surface: ResourceSurface,
  ticketId: string,
  file: File,
  displayName?: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ticketId", ticketId);

  const trimmedName = displayName?.trim();
  if (trimmedName) {
    formData.append("displayName", trimmedName);
  }

  return apiUpload<AssetListItem>(
    `${ticketsBase(surface)}/subir-archivo`,
    formData,
    true,
  );
}

export function listTicketPriorities(surface: ResourceSurface = "internal") {
  return apiFetch<TicketCatalogItem[]>(
    `${ticketsBase(surface)}/catalogos/prioridades`,
    {},
    true,
  );
}

export function listTicketCategories(surface: ResourceSurface = "internal") {
  return apiFetch<TicketCatalogItem[]>(
    `${ticketsBase(surface)}/catalogos/categorias`,
    {},
    true,
  );
}

export function listTicketPaymentStatuses() {
  return apiFetch<TicketCatalogItem[]>(
    "/internal/tickets/catalogos/estados-pago",
    {},
    true,
  );
}
