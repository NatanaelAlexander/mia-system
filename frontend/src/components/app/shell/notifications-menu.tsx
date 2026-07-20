"use client";

import Link from "next/link";
import { Bell, FileText, MessageSquare, Ticket, XIcon } from "lucide-react";
import { useNotifications } from "@/providers/notifications-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/components/app/api/notifications";
import { publicQuoteHref } from "@/components/app/quotes/quotes-module";

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

function NotificationIcon({ notification }: { notification: AppNotification }) {
  if (notification.kind === "quote" || notification.type === "quote_sent") {
    return <FileText className="size-4 shrink-0 text-primary" />;
  }

  if (notification.type === "ticket_created") {
    return <Ticket className="size-4 shrink-0 text-primary" />;
  }

  return <MessageSquare className="size-4 shrink-0 text-primary" />;
}

function notificationHref(notification: AppNotification): string {
  if (
    notification.kind === "quote" &&
    notification.quoteId &&
    notification.shareToken
  ) {
    return publicQuoteHref(notification.quoteId, notification.shareToken);
  }

  if (
    notification.kind === "quote" &&
    notification.companyId &&
    notification.quoteId
  ) {
    return `/app/companies/${notification.companyId}?tab=cotizaciones`;
  }

  if (notification.projectId && notification.ticketId) {
    return `/app/projects/${notification.projectId}/tickets/${notification.ticketId}`;
  }

  if (notification.companyId) {
    return `/app/companies/${notification.companyId}?tab=cotizaciones`;
  }

  return "/app";
}

interface NotificationsMenuProps {
  /** Compact icon button for the top header (mobile). */
  variant?: "sidebar" | "header";
}

export function NotificationsMenu({
  variant = "sidebar",
}: NotificationsMenuProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications();

  const isHeader = variant === "header";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          isHeader
            ? "relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-hidden transition-colors hover:bg-muted hover:text-foreground"
            : "relative flex w-full items-center gap-2 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 px-2.5 py-2 text-sm outline-hidden transition-colors hover:bg-sidebar-accent",
        )}
        render={<button type="button" aria-label="Notificaciones" />}
      >
        <Bell className="size-4 shrink-0" />
        {!isHeader ? (
          <span className="flex-1 text-left group-data-[collapsible=icon]:hidden">
            Notificaciones
          </span>
        ) : null}
        {unreadCount > 0 ? (
          <span
            className={cn(
              "inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground",
              isHeader
                ? "absolute -top-1 -right-1"
                : "group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:-right-1",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isHeader ? "end" : "start"}
        side={isHeader ? "bottom" : "top"}
        sideOffset={8}
        className="w-[min(20rem,calc(100vw-1.5rem))] p-0"
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
              <div
                key={notification.id}
                className={cn(
                  "group/item flex items-start gap-0.5 rounded-md",
                  !notification.readAt && "bg-primary/5",
                )}
              >
                <Link
                  href={notificationHref(notification)}
                  className="flex min-w-0 flex-1 items-start gap-2 rounded-md px-2 py-2.5 outline-hidden hover:bg-accent"
                  onClick={() => {
                    if (!notification.readAt) {
                      void markAsRead(notification.id);
                    }
                  }}
                >
                  <NotificationIcon notification={notification} />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="line-clamp-2 text-sm leading-snug">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label="Descartar notificación"
                  className="mt-1.5 mr-1 shrink-0 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void dismiss(notification.id);
                  }}
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
