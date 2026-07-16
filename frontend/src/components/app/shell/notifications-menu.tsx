"use client";

import Link from "next/link";
import { Bell, MessageSquare, Ticket } from "lucide-react";
import { useNotifications } from "@/providers/notifications-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TicketNotification } from "@/components/app/api/notifications";

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Ahora";
  }

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Hace ${diffDays} d`;
}

function NotificationIcon({ type }: { type: TicketNotification["type"] }) {
  if (type === "ticket_created") {
    return <Ticket className="size-4 shrink-0 text-primary" />;
  }

  return <MessageSquare className="size-4 shrink-0 text-primary" />;
}

export function NotificationsMenu() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "relative flex w-full items-center gap-2 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 px-2.5 py-2 text-sm outline-hidden transition-colors hover:bg-sidebar-accent",
        )}
        render={<button type="button" />}
      >
        <Bell className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left group-data-[collapsible=icon]:hidden">
          Notificaciones
        </span>
        {unreadCount > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:-right-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-medium">Notificaciones</p>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => void markAllAsRead()}
            >
              Marcar leídas
            </Button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto p-1">
          {isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Cargando...
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No tienes notificaciones.
            </p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-2.5",
                  !notification.readAt && "bg-primary/5",
                )}
                render={
                  <Link
                    href={`/app/projects/${notification.projectId}/tickets/${notification.ticketId}`}
                  />
                }
                onClick={() => {
                  if (!notification.readAt) {
                    void markAsRead(notification.id);
                  }
                }}
              >
                <NotificationIcon type={notification.type} />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="line-clamp-2 text-sm leading-snug">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
