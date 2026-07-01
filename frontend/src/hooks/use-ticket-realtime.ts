"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import type { TicketComment } from "@/components/app/api/tickets";
import { getAccessToken } from "@/lib/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export interface TicketPresenceUser {
  userId: string;
  firstName: string;
  lastName: string;
}

interface UseTicketRealtimeOptions {
  ticketId: string;
  enabled?: boolean;
  onCommentCreated?: (comment: TicketComment) => void;
  onTyping?: (payload: {
    userId: string;
    firstName: string;
    lastName: string;
    isTyping: boolean;
  }) => void;
  onPresence?: (users: TicketPresenceUser[]) => void;
}

export function useTicketRealtime({
  ticketId,
  enabled = true,
  onCommentCreated,
  onTyping,
  onPresence,
}: UseTicketRealtimeOptions) {
  const socketRef = React.useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  const onCommentCreatedRef = React.useRef(onCommentCreated);
  const onTypingRef = React.useRef(onTyping);
  const onPresenceRef = React.useRef(onPresence);

  React.useEffect(() => {
    onCommentCreatedRef.current = onCommentCreated;
    onTypingRef.current = onTyping;
    onPresenceRef.current = onPresence;
  }, [onCommentCreated, onPresence, onTyping]);

  React.useEffect(() => {
    if (!enabled || !ticketId) {
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

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("ticket.join", { ticketId });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleCommentCreated = (comment: TicketComment) => {
      if (comment.ticketId === ticketId) {
        onCommentCreatedRef.current?.(comment);
      }
    };

    const handleTyping = (payload: {
      ticketId: string;
      userId: string;
      firstName: string;
      lastName: string;
      isTyping: boolean;
    }) => {
      if (payload.ticketId === ticketId) {
        onTypingRef.current?.(payload);
      }
    };

    const handlePresence = (payload: {
      ticketId: string;
      users: TicketPresenceUser[];
    }) => {
      if (payload.ticketId === ticketId) {
        onPresenceRef.current?.(payload.users);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("comment.created", handleCommentCreated);
    socket.on("comment.typing", handleTyping);
    socket.on("ticket.presence", handlePresence);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.emit("ticket.leave", { ticketId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("comment.created", handleCommentCreated);
      socket.off("comment.typing", handleTyping);
      socket.off("ticket.presence", handlePresence);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, ticketId]);

  const emitTyping = React.useCallback(
    (isTyping: boolean, isInternal = false) => {
      socketRef.current?.emit("comment.typing", {
        ticketId,
        isTyping,
        isInternal,
      });
    },
    [ticketId],
  );

  return { isConnected, emitTyping };
}
