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
  statusId: string;
  statusName: string;
  priorityName: string;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketKanbanItem extends TicketListItem {
  projectId: string;
  lastCommentAuthorFirstName: string | null;
  lastCommentAuthorLastName: string | null;
  lastCommentAt: string | null;
  isClosed: boolean;
  isWorking: boolean;
  assignees?: TicketAssignee[];
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
  assignees?: TicketAssignee[];
}

export interface TicketAssignee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isSuperAdmin: boolean;
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
  authorIsClient: boolean;
}

export interface ListTicketsFilters {
  projectId?: string;
  lifecycle?: "all" | "active" | "closed";
  workingOnly?: boolean;
}

export type TicketTimelineRange = "day" | "month" | "year";

export interface TicketTimelinePoint {
  date: string;
  total: number;
  open: number;
  closed: number;
}

export interface CreateTicketPayload {
  projectId: string;
  title: string;
  description?: string;
  priorityId: string;
  categoryId?: string;
  paymentStatusId?: string;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string | null;
  priorityId?: string;
  categoryId?: string | null;
  paymentStatusId?: string | null;
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
  return apiFetchDetalle<TicketKanbanItem[]>(
    `${ticketsBase(surface)}/listar`,
    filters,
    true,
  );
}

export function getTicketTimeline(
  surface: ResourceSurface,
  range: TicketTimelineRange,
) {
  return apiFetchDetalle<TicketTimelinePoint[]>(
    `${ticketsBase(surface)}/estadisticas/timeline`,
    { range },
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
  return apiFetch<TicketDetail>(
    ticketsBase(surface),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function updateTicket(ticketId: string, payload: UpdateTicketPayload) {
  return apiFetch<TicketDetail>(
    `/internal/tickets/${ticketId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true,
  );
}

export function listTicketAssignees(ticketId: string) {
  return apiFetchDetalle<TicketAssignee[]>(
    "/internal/tickets/asignados/listar",
    { ticketId },
    true,
  );
}

export function replaceTicketAssignees(ticketId: string, userIds: string[]) {
  return apiFetch<TicketAssignee[]>(
    `/internal/tickets/${ticketId}/asignados`,
    {
      method: "PATCH",
      body: JSON.stringify({ userIds }),
    },
    true,
  );
}

export function changeTicketStatus(ticketId: string, statusId: string) {
  return apiFetch<TicketDetail>(
    `/internal/tickets/${ticketId}/estado`,
    {
      method: "PATCH",
      body: JSON.stringify({ statusId }),
    },
    true,
  );
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

  return apiFetch<TicketComment>(
    `${ticketsBase(surface)}/comentarios`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    true,
  );
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

export function listTicketStatuses(surface: ResourceSurface = "internal") {
  return apiFetch<TicketCatalogItem[]>(
    `${ticketsBase(surface)}/catalogos/estados`,
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
