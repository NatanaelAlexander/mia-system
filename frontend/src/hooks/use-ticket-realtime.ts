"use client";

import * as React from "react";
import type { AssetListItem } from "@/components/app/api/assets";
import type { TicketComment } from "@/components/app/api/tickets";
import { useRealtime } from "@/providers/realtime-provider";

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
  const { socket, isConnected, joinTicket, leaveTicket } = useRealtime();
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
    if (!enabled || !ticketId || !socket) {
      return;
    }

    const handleConnect = () => {
      joinTicket(ticketId);
      if (hasConnectedRef.current) {
        onReconnectRef.current?.();
      }
      hasConnectedRef.current = true;
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
    socket.on("comment.created", handleCommentCreated);
    socket.on("comment.assets_uploading", handleCommentAssetsUploading);
    socket.on("comment.asset_added", handleCommentAssetAdded);
    socket.on("comment.assets_updated", handleCommentAssetsUpdated);
    socket.on("comment.typing", handleTyping);
    socket.on("ticket.presence", handlePresence);

    if (socket.connected) {
      joinTicket(ticketId);
      hasConnectedRef.current = true;
    }

    return () => {
      leaveTicket(ticketId);
      socket.off("connect", handleConnect);
      socket.off("comment.created", handleCommentCreated);
      socket.off("comment.assets_uploading", handleCommentAssetsUploading);
      socket.off("comment.asset_added", handleCommentAssetAdded);
      socket.off("comment.assets_updated", handleCommentAssetsUpdated);
      socket.off("comment.typing", handleTyping);
      socket.off("ticket.presence", handlePresence);
      hasConnectedRef.current = false;
    };
  }, [enabled, joinTicket, leaveTicket, socket, ticketId]);

  const emitTyping = React.useCallback(
    (isTyping: boolean, isInternal = false) => {
      socket?.emit("comment.typing", {
        ticketId,
        isTyping,
        isInternal,
      });
    },
    [socket, ticketId],
  );

  const emitAssetsUploading = React.useCallback(
    (commentId: string, count: number, isInternal = false) => {
      socket?.emit("comment.assets_uploading", {
        ticketId,
        commentId,
        count,
        isInternal,
      });
    },
    [socket, ticketId],
  );

  return { isConnected, emitTyping, emitAssetsUploading };
}
