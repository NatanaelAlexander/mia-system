"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markTicketNotificationsAsRead,
  type TicketNotification,
} from "@/components/app/api/notifications";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { getAccessToken } from "@/lib/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

interface NotificationsContextValue {
  notifications: TicketNotification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  reload: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markTicketAsRead: (ticketId: string) => Promise<void>;
}

const NotificationsContext =
  React.createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { claims } = useAuth();
  const socketRef = React.useRef<Socket | null>(null);
  const [notifications, setNotifications] = React.useState<TicketNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  const surface = claims ? preferredSurface(claims) : "portal";

  const reload = React.useCallback(async () => {
    if (!claims) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const data = await listNotifications(surface);
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } finally {
      setIsLoading(false);
    }
  }, [claims, surface]);

  const markAsRead = React.useCallback(
    async (notificationId: string) => {
      if (!claims) {
        return;
      }

      await markNotificationAsRead(surface, notificationId);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    },
    [claims, surface],
  );

  const markAllAsRead = React.useCallback(async () => {
    if (!claims) {
      return;
    }

    await markAllNotificationsAsRead(surface);
    const now = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? now })),
    );
    setUnreadCount(0);
  }, [claims, surface]);

  const markTicketAsRead = React.useCallback(
    async (ticketId: string) => {
      if (!claims) {
        return;
      }

      await markTicketNotificationsAsRead(surface, ticketId);
      const now = new Date().toISOString();
      setNotifications((current) => {
        let removed = 0;
        const next = current.map((item) => {
          if (item.ticketId === ticketId && !item.readAt) {
            removed += 1;
            return { ...item, readAt: now };
          }
          return item;
        });
        if (removed > 0) {
          setUnreadCount((count) => Math.max(0, count - removed));
        }
        return next;
      });
    },
    [claims, surface],
  );

  React.useEffect(() => {
    if (!claims) {
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    void reload();
  }, [claims?.sub, claims?.permVersion, reload]);

  React.useEffect(() => {
    if (!claims) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      return;
    }

    const socket = io(`${API_BASE_URL}/notifications`, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleNotificationCreated = (payload: TicketNotification) => {
      setNotifications((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== payload.id);
        return [payload, ...withoutDuplicate].slice(0, 30);
      });
    };

    const handleNotificationsUpdated = (payload: { unreadCount: number }) => {
      setUnreadCount(payload.unreadCount ?? 0);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification.created", handleNotificationCreated);
    socket.on("notifications.updated", handleNotificationsUpdated);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("notification.created", handleNotificationCreated);
      socket.off("notifications.updated", handleNotificationsUpdated);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [claims?.sub, claims?.permVersion, reload]);

  const value = React.useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      isConnected,
      reload,
      markAsRead,
      markAllAsRead,
      markTicketAsRead,
    }),
    [
      isConnected,
      isLoading,
      markAllAsRead,
      markAsRead,
      markTicketAsRead,
      notifications,
      reload,
      unreadCount,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
