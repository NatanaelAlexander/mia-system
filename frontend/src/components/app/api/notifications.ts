import { apiFetch, apiFetchDetalle } from "@/lib/api/client";
import type { ResourceSurface } from "./types";

export type TicketNotificationType = "ticket_created" | "ticket_comment";

export interface TicketNotification {
  id: string;
  ticketId: string;
  projectId: string;
  type: TicketNotificationType;
  commentId: string | null;
  actorUserId: string;
  actorFirstName: string;
  actorLastName: string;
  ticketTitle: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface TicketNotificationListResult {
  items: TicketNotification[];
  unreadCount: number;
}

function notificationsBase(surface: ResourceSurface) {
  return surface === "internal"
    ? "/internal/notifications"
    : "/portal/notifications";
}

export function listNotifications(surface: ResourceSurface, limit = 30) {
  return apiFetchDetalle<TicketNotificationListResult>(
    `${notificationsBase(surface)}/listar`,
    { limit },
    true,
  );
}

export function markNotificationAsRead(
  surface: ResourceSurface,
  notificationId: string,
) {
  return apiFetch<{ ok: true }>(
    `${notificationsBase(surface)}/${notificationId}/leer`,
    { method: "PATCH" },
    true,
  );
}

export function markAllNotificationsAsRead(surface: ResourceSurface) {
  return apiFetch<{ ok: true }>(
    `${notificationsBase(surface)}/leer-todas`,
    { method: "PATCH" },
    true,
  );
}

export function markTicketNotificationsAsRead(
  surface: ResourceSurface,
  ticketId: string,
) {
  return apiFetch<{ ok: true }>(
    `${notificationsBase(surface)}/ticket/${ticketId}/leer`,
    { method: "PATCH" },
    true,
  );
}
