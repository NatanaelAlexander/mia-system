"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import type { AssetListItem } from "@/components/app/api/assets";
import type { TicketComment } from "@/components/app/api/tickets";
import { getAccessToken } from "@/lib/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export interface TicketPresenceUser {
  userId: string;
  firstName: string;
  lastName: string;
}

export interface CommentAssetAddedPayload {
  ticketId: string;
  commentId: string;
  isInternal: boolean;
  asset: AssetListItem;
}

export interface CommentAssetsUpdatedPayload {
  ticketId: string;
  commentId: string;
  isInternal: boolean;
  assets: AssetListItem[];
}

export interface CommentAssetsUploadingPayload {
  ticketId: string;
  commentId: string;
  isInternal: boolean;
  count: number;
}

interface UseTicketRealtimeOptions {
  ticketId: string;
  enabled?: boolean;
  onCommentCreated?: (comment: TicketComment) => void;
  onCommentAssetsUploading?: (payload: CommentAssetsUploadingPayload) => void;
  onCommentAssetAdded?: (payload: CommentAssetAddedPayload) => void;
  onCommentAssetsUpdated?: (payload: CommentAssetsUpdatedPayload) => void;
  onReconnect?: () => void;
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
  onCommentAssetsUploading,
  onCommentAssetAdded,
  onCommentAssetsUpdated,
  onReconnect,
  onTyping,
  onPresence,
}: UseTicketRealtimeOptions) {
  const socketRef = React.useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const hasConnectedRef = React.useRef(false);

  const onCommentCreatedRef = React.useRef(onCommentCreated);
  const onCommentAssetsUploadingRef = React.useRef(onCommentAssetsUploading);
  const onCommentAssetAddedRef = React.useRef(onCommentAssetAdded);
  const onCommentAssetsUpdatedRef = React.useRef(onCommentAssetsUpdated);
  const onReconnectRef = React.useRef(onReconnect);
  const onTypingRef = React.useRef(onTyping);
  const onPresenceRef = React.useRef(onPresence);

  React.useEffect(() => {
    onCommentCreatedRef.current = onCommentCreated;
    onCommentAssetsUploadingRef.current = onCommentAssetsUploading;
    onCommentAssetAddedRef.current = onCommentAssetAdded;
    onCommentAssetsUpdatedRef.current = onCommentAssetsUpdated;
    onReconnectRef.current = onReconnect;
    onTypingRef.current = onTyping;
    onPresenceRef.current = onPresence;
  }, [
    onCommentAssetAdded,
    onCommentAssetsUploading,
    onCommentAssetsUpdated,
    onCommentCreated,
    onPresence,
    onReconnect,
    onTyping,
  ]);

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

      if (hasConnectedRef.current) {
        onReconnectRef.current?.();
      }

      hasConnectedRef.current = true;
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleCommentCreated = (comment: TicketComment) => {
      if (comment.ticketId === ticketId) {
        onCommentCreatedRef.current?.(comment);
      }
    };

    const handleCommentAssetsUploading = (
      payload: CommentAssetsUploadingPayload,
    ) => {
      if (payload.ticketId === ticketId) {
        onCommentAssetsUploadingRef.current?.(payload);
      }
    };

    const handleCommentAssetAdded = (payload: CommentAssetAddedPayload) => {
      if (payload.ticketId === ticketId) {
        onCommentAssetAddedRef.current?.(payload);
      }
    };

    const handleCommentAssetsUpdated = (payload: CommentAssetsUpdatedPayload) => {
      if (payload.ticketId === ticketId) {
        onCommentAssetsUpdatedRef.current?.(payload);
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
    socket.on("comment.assets_uploading", handleCommentAssetsUploading);
    socket.on("comment.asset_added", handleCommentAssetAdded);
    socket.on("comment.assets_updated", handleCommentAssetsUpdated);
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
      socket.off("comment.assets_uploading", handleCommentAssetsUploading);
      socket.off("comment.asset_added", handleCommentAssetAdded);
      socket.off("comment.assets_updated", handleCommentAssetsUpdated);
      socket.off("comment.typing", handleTyping);
      socket.off("ticket.presence", handlePresence);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      hasConnectedRef.current = false;
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

  const emitAssetsUploading = React.useCallback(
    (commentId: string, count: number, isInternal = false) => {
      socketRef.current?.emit("comment.assets_uploading", {
        ticketId,
        commentId,
        count,
        isInternal,
      });
    },
    [ticketId],
  );

  return { isConnected, emitTyping, emitAssetsUploading };
}
