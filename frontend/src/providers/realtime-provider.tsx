"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/auth/session";
import { useAuth } from "@/hooks/use-auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export interface AppPresenceUser {
  userId: string;
  firstName: string;
  lastName: string;
  roles: string[];
  surfaces: string[];
}

interface RealtimeContextValue {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: AppPresenceUser[];
  canWatchPresence: boolean;
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
}

const RealtimeContext = React.createContext<RealtimeContextValue | null>(null);

function canWatchAppPresence(roles: string[], surfaces: string[]): boolean {
  return (
    surfaces.includes("internal") &&
    (roles.includes("admin") || roles.includes("super_admin"))
  );
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { claims } = useAuth();
  const socketRef = React.useRef<Socket | null>(null);
  const joinedTicketsRef = React.useRef<Set<string>>(new Set());
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [onlineUsers, setOnlineUsers] = React.useState<AppPresenceUser[]>([]);

  const canWatchPresence = React.useMemo(() => {
    if (!claims) {
      return false;
    }
    return canWatchAppPresence(claims.roles, claims.surfaces);
  }, [claims]);

  const joinTicket = React.useCallback((ticketId: string) => {
    if (!ticketId) {
      return;
    }
    joinedTicketsRef.current.add(ticketId);
    socketRef.current?.emit("ticket.join", { ticketId });
  }, []);

  const leaveTicket = React.useCallback((ticketId: string) => {
    if (!ticketId) {
      return;
    }
    joinedTicketsRef.current.delete(ticketId);
    socketRef.current?.emit("ticket.leave", { ticketId });
  }, []);

  React.useEffect(() => {
    if (!claims) {
      setIsConnected(false);
      setOnlineUsers([]);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      return;
    }

    const socket = io(`${API_BASE_URL}/tickets`, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    setSocket(socket);

    const handleConnect = () => {
      setIsConnected(true);
      for (const ticketId of joinedTicketsRef.current) {
        socket.emit("ticket.join", { ticketId });
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleAppPresence = (payload: { users: AppPresenceUser[] }) => {
      setOnlineUsers(payload.users ?? []);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("app.presence", handleAppPresence);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      for (const ticketId of joinedTicketsRef.current) {
        socket.emit("ticket.leave", { ticketId });
      }
      joinedTicketsRef.current.clear();
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("app.presence", handleAppPresence);
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [claims?.sub, claims?.permVersion]);

  const value = React.useMemo<RealtimeContextValue>(
    () => ({
      socket,
      isConnected,
      onlineUsers,
      canWatchPresence,
      joinTicket,
      leaveTicket,
    }),
    [canWatchPresence, isConnected, joinTicket, leaveTicket, onlineUsers, socket],
  );

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = React.useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return context;
}
