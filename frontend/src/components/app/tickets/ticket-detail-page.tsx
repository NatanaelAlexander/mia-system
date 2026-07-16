"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Paperclip, RefreshCcw, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
  getAssetDownloadUrl,
  type AssetListItem,
} from "@/components/app/api/assets";
import { listCompanies } from "@/components/app/api/companies";
import { getProjectDetail } from "@/components/app/api/projects";
import {
  addTicketComment,
  getTicketDetail,
  listTicketAssets,
  listTicketCommentAssets,
  listTicketComments,
  uploadTicketCommentAsset,
  type TicketComment,
  type TicketDetail,
} from "@/components/app/api/tickets";
import { AttachmentPickDialog } from "@/components/app/shared/attachment-pick-dialog";
import {
  collectFiles,
  filesToPendingAttachments,
  getAttachmentLabel,
  type PendingAttachment,
} from "@/components/app/shared/attachment-utils";
import { formatFileSize } from "@/components/app/shared/format";
import { ErrorState } from "@/components/app/shared/list-states";
import {
  hasPermission,
  isInternalUser,
  canAccessModule,
} from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { useTicketRealtime } from "@/hooks/use-ticket-realtime";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/providers/notifications-provider";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectContextHeader } from "../projects/project-context-header";
import { EntityQuotesList } from "@/components/app/quotes/company-quotes-section";
import { quotesModule } from "@/components/app/quotes/quotes-module";
import {
  TicketChatMessage,
  TicketChatTypingIndicator,
  type TicketChatComment,
} from "./ticket-chat-message";
import {
  TicketAssigneesControl,
  TicketStatusControl,
  useTicketManagement,
} from "./ticket-management-controls";

type CommentWithAssets = TicketChatComment;

interface TicketDetailPageProps {
  projectId: string;
  ticketId: string;
}

function normalizeAsset(asset: AssetListItem): AssetListItem {
  return {
    ...asset,
    createdAt:
      typeof asset.createdAt === "string"
        ? asset.createdAt
        : new Date(asset.createdAt).toISOString(),
  };
}

function mergeComments(
  current: CommentWithAssets[],
  incoming: TicketComment,
  assets?: AssetListItem[],
  pendingAssets: AssetListItem[] = [],
  assetSyncStatus?: CommentWithAssets["assetSyncStatus"],
): CommentWithAssets[] {
  const existingIndex = current.findIndex((item) => item.id === incoming.id);

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    const nextAssets =
      assets !== undefined
        ? assets
        : pendingAssets.length > 0
          ? pendingAssets
          : existing.assets;

    const next = [...current];
    next[existingIndex] = {
      ...existing,
      ...incoming,
      assets: nextAssets,
      assetSyncStatus: assetSyncStatus ?? existing.assetSyncStatus,
    };
    return next;
  }

  const initialAssets = assets ?? pendingAssets;

  return [
    ...current,
    { ...incoming, assets: initialAssets, assetSyncStatus },
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function replaceCommentAssets(
  current: CommentWithAssets[],
  commentId: string,
  assets: AssetListItem[],
): CommentWithAssets[] {
  const existingIndex = current.findIndex((item) => item.id === commentId);
  if (existingIndex < 0) {
    return current;
  }

  const next = [...current];
  next[existingIndex] = {
    ...next[existingIndex],
    assets: assets.map(normalizeAsset),
  };
  return next;
}

function appendCommentAsset(
  current: CommentWithAssets[],
  commentId: string,
  asset: AssetListItem,
): CommentWithAssets[] {
  const existingIndex = current.findIndex((item) => item.id === commentId);
  if (existingIndex < 0) {
    return current;
  }

  const normalized = normalizeAsset(asset);
  const existing = current[existingIndex];
  if (existing.assets.some((item) => item.id === normalized.id)) {
    return current;
  }

  const next = [...current];
  next[existingIndex] = {
    ...existing,
    assets: [...existing.assets, normalized],
  };
  return next;
}

function setCommentAssetSyncStatus(
  current: CommentWithAssets[],
  commentId: string,
  assetSyncStatus?: CommentWithAssets["assetSyncStatus"],
): CommentWithAssets[] {
  const existingIndex = current.findIndex((item) => item.id === commentId);
  if (existingIndex < 0) {
    return current;
  }

  const next = [...current];
  next[existingIndex] = {
    ...next[existingIndex],
    assetSyncStatus,
  };
  return next;
}

function TicketMetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function TicketDetailPage({
  projectId,
  ticketId,
}: TicketDetailPageProps) {
  const router = useRouter();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const { markTicketAsRead } = useNotifications();
  const surface = claims ? preferredSurface(claims) : "portal";
  const isInternal = isInternalUser(claims);
  const canComment = hasPermission(claims, "ticket_comments:create");
  const canUpload = hasPermission(claims, "assets:create");
  const canDownload = hasPermission(claims, "assets:read");
  const canPostInternal =
    isInternal && hasPermission(claims, "ticket_comments:create");
  const canViewQuotes = canAccessModule(claims, quotesModule);

  const threadEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [isComposerDragging, setIsComposerDragging] = React.useState(false);
  const [attachmentPickOpen, setAttachmentPickOpen] = React.useState(false);
  const [attachmentInitialFile, setAttachmentInitialFile] =
    React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [projectName, setProjectName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [companyId, setCompanyId] = React.useState("");
  const [comments, setComments] = React.useState<CommentWithAssets[]>([]);
  const [ticketAssets, setTicketAssets] = React.useState<AssetListItem[]>([]);
  const [message, setMessage] = React.useState("");
  const [isInternalComment, setIsInternalComment] = React.useState(false);
  const [pendingAttachments, setPendingAttachments] = React.useState<
    PendingAttachment[]
  >([]);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

  const management = useTicketManagement({
    ticket,
    onTicketChange: setTicket,
    enabled: isInternal,
  });

  const commentsRef = React.useRef(comments);
  const pendingCommentAssetsRef = React.useRef(
    new Map<string, AssetListItem[]>(),
  );
  const pendingCommentAssetStatusesRef = React.useRef(new Set<string>());
  const assetSyncTimersRef = React.useRef(new Map<string, number[]>());

  React.useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  React.useEffect(
    () => () => {
      assetSyncTimersRef.current.forEach((timers) => {
        timers.forEach((timerId) => window.clearTimeout(timerId));
      });
      assetSyncTimersRef.current.clear();
    },
    [],
  );

  const consumePendingAssets = React.useCallback((commentId: string) => {
    const pending = pendingCommentAssetsRef.current.get(commentId) ?? [];
    pendingCommentAssetsRef.current.delete(commentId);
    return pending;
  }, []);

  const consumePendingAssetStatus = React.useCallback((commentId: string) => {
    const hasStatus = pendingCommentAssetStatusesRef.current.has(commentId);
    pendingCommentAssetStatusesRef.current.delete(commentId);
    return hasStatus;
  }, []);

  const stashPendingAssetStatus = React.useCallback((commentId: string) => {
    pendingCommentAssetStatusesRef.current.add(commentId);
  }, []);

  const stashPendingAssets = React.useCallback(
    (commentId: string, assets: AssetListItem[]) => {
      if (assets.length === 0) {
        return;
      }

      const map = pendingCommentAssetsRef.current;
      const current = map.get(commentId) ?? [];
      const merged = [...current];

      for (const asset of assets.map(normalizeAsset)) {
        if (!merged.some((item) => item.id === asset.id)) {
          merged.push(asset);
        }
      }

      map.set(commentId, merged);
    },
    [],
  );

  const applyCommentAssets = React.useCallback(
    async (commentId: string) => {
      try {
        const assets = await listTicketCommentAssets(surface, commentId);
        setComments((current) =>
          replaceCommentAssets(current, commentId, assets),
        );
      } catch {
        // Ignorar fallos puntuales de sincronización.
      }
    },
    [surface],
  );

  const scheduleCommentAssetSync = React.useCallback(
    (commentId: string) => {
      const existing = assetSyncTimersRef.current.get(commentId) ?? [];
      existing.forEach((timerId) => window.clearTimeout(timerId));

      const delays = [400, 1000, 2500, 5000];
      const timers = delays.map((delay, index) =>
        window.setTimeout(() => {
          void applyCommentAssets(commentId);
          if (index === delays.length - 1) {
            setComments((current) =>
              setCommentAssetSyncStatus(current, commentId),
            );
          }
        }, delay),
      );

      assetSyncTimersRef.current.set(commentId, timers);
    },
    [applyCommentAssets],
  );

  const refreshAllCommentAssets = React.useCallback(async () => {
    await Promise.all(
      commentsRef.current.map((comment) => applyCommentAssets(comment.id)),
    );
  }, [applyCommentAssets]);

  const openAttachmentPicker = React.useCallback((file?: File | null) => {
    setAttachmentInitialFile(file ?? null);
    setAttachmentPickOpen(true);
  }, []);

  const rejectOversized = React.useCallback((file: File) => {
    toast.error(`"${file.name}" supera el límite de 50 MB.`);
  }, []);

  const addFiles = React.useCallback(
    (files: FileList | null) => {
      const collected = collectFiles(files, { onRejected: rejectOversized });
      if (collected.length === 0) {
        return;
      }

      if (collected.length === 1) {
        openAttachmentPicker(collected[0]);
        return;
      }

      setPendingAttachments((current) => [
        ...current,
        ...filesToPendingAttachments(collected),
      ]);
      toast.success(`${collected.length} archivos agregados`);
    },
    [openAttachmentPicker, rejectOversized],
  );

  const loadThread = React.useCallback(async () => {
    if (!claims) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [project, companies, ticketData, commentData, assetsData] =
        await Promise.all([
          getProjectDetail(surface, projectId),
          listCompanies(surface, {}),
          getTicketDetail(surface, ticketId),
          listTicketComments(surface, ticketId),
          listTicketAssets(surface, ticketId).catch(
            () => [] as AssetListItem[],
          ),
        ]);

      if (ticketData.projectId !== projectId) {
        throw new ApiError(404, "El ticket no pertenece a este proyecto.");
      }

      const assetsByComment = await Promise.all(
        commentData.map(async (comment) => {
          try {
            const assets = await listTicketCommentAssets(surface, comment.id);
            return { commentId: comment.id, assets };
          } catch {
            return { commentId: comment.id, assets: [] as AssetListItem[] };
          }
        }),
      );

      const assetsMap = Object.fromEntries(
        assetsByComment.map((item) => [item.commentId, item.assets]),
      );

      setProjectName(project.name);
      setCompanyId(project.companyId);
      setCompanyName(
        companies.find((company) => company.id === project.companyId)?.name ??
          "",
      );
      setTicket(ticketData);
      setTicketAssets(assetsData);
      setComments(
        commentData.map((comment) => ({
          ...comment,
          assets: assetsMap[comment.id] ?? [],
        })),
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cargar el ticket.";
      setErrorMessage(message);
      setTicket(null);
      setComments([]);
      setTicketAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [claims, projectId, surface, ticketId]);

  React.useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void loadThread();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isAuthLoading, loadThread]);

  React.useEffect(() => {
    if (!ticket) {
      return;
    }

    void markTicketAsRead(ticket.id);
  }, [markTicketAsRead, ticket?.id]);

  React.useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleRealtimeComment = React.useCallback(
    (comment: TicketComment) => {
      if (comment.isInternal && !isInternal) {
        return;
      }

      const pendingAssets = consumePendingAssets(comment.id);
      const hasPendingAssetStatus = consumePendingAssetStatus(comment.id);
      const shouldShowReceiving =
        comment.userId !== claims?.sub &&
        pendingAssets.length === 0 &&
        hasPendingAssetStatus;

      setComments((current) =>
        mergeComments(
          current,
          comment,
          undefined,
          pendingAssets,
          shouldShowReceiving ? "receiving" : undefined,
        ),
      );

      if (shouldShowReceiving) {
        scheduleCommentAssetSync(comment.id);
      }
    },
    [
      claims?.sub,
      consumePendingAssets,
      consumePendingAssetStatus,
      isInternal,
      scheduleCommentAssetSync,
    ],
  );

  const handleRealtimeCommentAssetsUploading = React.useCallback(
    (payload: {
      ticketId: string;
      commentId: string;
      isInternal: boolean;
      count: number;
    }) => {
      if (payload.isInternal && !isInternal) {
        return;
      }

      setComments((current) => {
        if (!current.some((item) => item.id === payload.commentId)) {
          stashPendingAssetStatus(payload.commentId);
          return current;
        }

        return setCommentAssetSyncStatus(
          current,
          payload.commentId,
          "receiving",
        );
      });

      scheduleCommentAssetSync(payload.commentId);
    },
    [isInternal, scheduleCommentAssetSync, stashPendingAssetStatus],
  );

  const handleRealtimeCommentAsset = React.useCallback(
    (payload: {
      ticketId: string;
      commentId: string;
      isInternal: boolean;
      asset: AssetListItem;
    }) => {
      if (payload.isInternal && !isInternal) {
        return;
      }

      const asset = normalizeAsset(payload.asset);

      setComments((current) => {
        if (!current.some((item) => item.id === payload.commentId)) {
          stashPendingAssets(payload.commentId, [asset]);
          return current;
        }

        const next = appendCommentAsset(current, payload.commentId, asset);
        const comment = next.find((item) => item.id === payload.commentId);

        if (comment?.userId === claims?.sub) {
          return next;
        }

        return setCommentAssetSyncStatus(next, payload.commentId);
      });
    },
    [claims?.sub, isInternal, stashPendingAssets],
  );

  const handleRealtimeCommentAssetsUpdated = React.useCallback(
    (payload: {
      ticketId: string;
      commentId: string;
      isInternal: boolean;
      assets: AssetListItem[];
    }) => {
      if (payload.isInternal && !isInternal) {
        return;
      }

      const assets = payload.assets.map(normalizeAsset);

      setComments((current) => {
        if (!current.some((item) => item.id === payload.commentId)) {
          stashPendingAssets(payload.commentId, assets);
          return current;
        }

        const next = replaceCommentAssets(current, payload.commentId, assets);
        const comment = next.find((item) => item.id === payload.commentId);

        if (comment?.userId === claims?.sub || assets.length === 0) {
          return next;
        }

        return setCommentAssetSyncStatus(next, payload.commentId);
      });
    },
    [claims?.sub, isInternal, stashPendingAssets],
  );

  const { isConnected, emitTyping, emitAssetsUploading } = useTicketRealtime({
    ticketId,
    enabled: Boolean(claims && ticket),
    onCommentCreated: handleRealtimeComment,
    onCommentAssetsUploading: handleRealtimeCommentAssetsUploading,
    onCommentAssetAdded: handleRealtimeCommentAsset,
    onCommentAssetsUpdated: handleRealtimeCommentAssetsUpdated,
    onReconnect: () => {
      void refreshAllCommentAssets();
    },
    onTyping: (payload) => {
      if (payload.userId === claims?.sub) {
        return;
      }

      const label = `${payload.firstName} ${payload.lastName}`.trim();
      setTypingUsers((current) => {
        if (payload.isTyping) {
          return current.includes(label) ? current : [...current, label];
        }

        return current.filter((item) => item !== label);
      });
    },
  });

  const resolveAuthorName = (comment: TicketComment) => {
    if (comment.userId === claims?.sub) {
      return "Tú";
    }

    const fullName =
      `${comment.authorFirstName ?? ""} ${comment.authorLastName ?? ""}`.trim();

    return fullName || "Usuario";
  };

  const handleDownload = async (asset: AssetListItem) => {
    if (!canDownload) {
      return;
    }

    try {
      const { url } = await getAssetDownloadUrl(surface, asset.id);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = asset.fileName;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo descargar el archivo.";
      toast.error(message);
    }
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed && pendingAttachments.length === 0) {
      return;
    }

    if (!canComment) {
      toast.error("No tienes permiso para comentar.");
      return;
    }

    setIsSending(true);
    emitTyping(false, isInternalComment);

    let createdCommentId: string | null = null;

    try {
      const commentIsInternal = canPostInternal ? isInternalComment : false;
      const created = await addTicketComment(surface, {
        ticketId,
        comment: trimmed || "(archivo adjunto)",
        isInternal: commentIsInternal,
      });
      createdCommentId = created.id;

      if (pendingAttachments.length > 0) {
        setComments((current) =>
          mergeComments(current, created, [], [], "uploading"),
        );
        emitAssetsUploading(
          created.id,
          pendingAttachments.length,
          commentIsInternal,
        );
      }

      const uploadedAssets: AssetListItem[] = [];
      for (const attachment of pendingAttachments) {
        const asset = await uploadTicketCommentAsset(
          surface,
          created.id,
          attachment.file,
          attachment.displayName,
        );
        uploadedAssets.push(asset);
      }

      setComments((current) =>
        setCommentAssetSyncStatus(
          mergeComments(current, created, uploadedAssets),
          created.id,
        ),
      );
      setMessage("");
      setPendingAttachments([]);
      setIsInternalComment(false);
    } catch (error) {
      const errorText =
        error instanceof ApiError
          ? error.message
          : "No se pudo enviar el mensaje.";
      toast.error(errorText);
    } finally {
      const commentId = createdCommentId;
      if (commentId) {
        setComments((current) =>
          setCommentAssetSyncStatus(current, commentId),
        );
      }
      setIsSending(false);
    }
  };

  if (!isAuthLoading && errorMessage && !ticket) {
    return <ErrorState message={errorMessage} onRetry={loadThread} />;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <ProjectContextHeader
        projectId={projectId}
        projectName={projectName || "Proyecto"}
        companyName={companyName}
        sectionTitle={ticket?.title ?? "Ticket"}
        sectionDescription="Conversación y archivos del ticket."
      />

      {canViewQuotes && companyId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cotizaciones del ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <EntityQuotesList
              companyId={companyId}
              projectId={projectId}
              ticketId={ticketId}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {ticket ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TicketMetaField
                  label="Prioridad"
                  value={ticket.priorityName}
                />
                {ticket.categoryName ? (
                  <TicketMetaField
                    label="Categoría"
                    value={ticket.categoryName}
                  />
                ) : null}
                {isInternal ? (
                  <TicketStatusControl
                    ticket={ticket}
                    management={management}
                  />
                ) : (
                  <TicketMetaField label="Estado" value={ticket.statusName} />
                )}
                {ticket.paymentStatusName ? (
                  <TicketMetaField
                    label="Pago"
                    value={ticket.paymentStatusName}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Cargando detalle del ticket...
              </p>
            )}
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={isConnected ? "secondary" : "outline"}>
                {isConnected ? "En vivo" : "Sin conexión"}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadThread()}
                disabled={isLoading}
              >
                <RefreshCcw />
                Actualizar
              </Button>
            </div>
          </div>
          {ticket?.description ? (
            <div className="mt-4 space-y-1 border-t border-border/60 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Descripción
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {ticket.description}
              </p>
            </div>
          ) : null}
          {ticket && isInternal ? (
            <div className="mt-4 border-t border-border/60 pt-4">
              <TicketAssigneesControl management={management} />
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {ticketAssets.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-border/70 p-4">
              <p className="text-sm font-medium">Archivos del ticket</p>
              <div className="space-y-1">
                {ticketAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{asset.fileName}</p>
                      <p className="text-muted-foreground">
                        {formatFileSize(asset.fileSize)}
                      </p>
                    </div>
                    {canDownload ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => void handleDownload(asset)}
                      >
                        <Download />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex min-h-[min(70dvh,32rem)] flex-col overflow-hidden rounded-xl border border-border/70 bg-background/40 md:max-h-[32rem] md:min-h-[18rem]">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Cargando conversación...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  Aún no hay mensajes. Escribe el primero o adjunta archivos.
                </p>
              ) : (
                comments.map((comment) => (
                  <TicketChatMessage
                    key={comment.id}
                    comment={comment}
                    isOwn={comment.userId === claims?.sub}
                    authorLabel={resolveAuthorName(comment)}
                    canDownload={canDownload}
                    onDownload={(asset) => void handleDownload(asset)}
                  />
                ))
              )}
              {typingUsers.length > 0 ? (
                <TicketChatTypingIndicator names={typingUsers} />
              ) : null}
              <div ref={threadEndRef} />
            </div>

            {canComment ? (
              <div
                className={cn(
                  "sticky bottom-0 relative border-t border-border/70 bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-colors supports-backdrop-filter:bg-card/80",
                  isComposerDragging && "ring-2 ring-inset ring-primary/20",
                )}
                onDragOver={(event) => {
                  if (!canUpload || attachmentPickOpen) {
                    return;
                  }
                  event.preventDefault();
                  setIsComposerDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  const nextTarget = event.relatedTarget as Node | null;
                  if (nextTarget && event.currentTarget.contains(nextTarget)) {
                    return;
                  }
                  setIsComposerDragging(false);
                }}
                onDrop={(event) => {
                  if (!canUpload || attachmentPickOpen) {
                    return;
                  }
                  event.preventDefault();
                  setIsComposerDragging(false);
                  addFiles(event.dataTransfer.files);
                }}
              >
                {isComposerDragging ? (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-primary/5">
                    <div className="rounded-lg border border-primary/40 bg-background px-3 py-2 text-xs font-medium text-primary">
                      Suelta los archivos para adjuntarlos al mensaje
                    </div>
                  </div>
                ) : null}

                {canPostInternal ? (
                  <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      disabled={isSending}
                      onChange={(event) =>
                        setIsInternalComment(event.target.checked)
                      }
                    />
                    Comentario interno (solo equipo)
                  </label>
                ) : null}

                {pendingAttachments.length > 0 ? (
                  <div className="mb-2 space-y-1.5">
                    {pendingAttachments.map((attachment, index) => (
                      <div
                        key={`${getAttachmentLabel(attachment)}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 px-2 py-1.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {getAttachmentLabel(attachment)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            setPendingAttachments((current) =>
                              current.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                        >
                          <X />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-end gap-2">
                  {canUpload ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        disabled={isSending}
                        onChange={(event) => {
                          addFiles(event.target.files);
                          event.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground"
                        disabled={isSending}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip />
                      </Button>
                    </>
                  ) : null}

                  <textarea
                    id="ticket-message"
                    rows={1}
                    value={message}
                    disabled={isSending}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      emitTyping(
                        event.target.value.trim().length > 0,
                        isInternalComment,
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50"
                  />

                  <Button
                    type="button"
                    size="icon"
                    className="size-10 shrink-0 rounded-full"
                    disabled={
                      isSending ||
                      (!message.trim() && pendingAttachments.length === 0)
                    }
                    onClick={() => void handleSend()}
                  >
                    <Send />
                    <span className="sr-only">
                      {isSending ? "Enviando..." : "Enviar"}
                    </span>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {canUpload ? (
        <AttachmentPickDialog
          open={attachmentPickOpen}
          onOpenChange={setAttachmentPickOpen}
          initialFile={attachmentInitialFile}
          title="Adjuntar al mensaje"
          description="Define un nombre visible opcional antes de agregar el archivo al comentario."
          confirmLabel="Agregar al mensaje"
          onConfirm={(attachment) =>
            setPendingAttachments((current) => [...current, attachment])
          }
        />
      ) : null}

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => router.push(`/app/projects/${projectId}/tickets`)}
        >
          Volver a tickets del proyecto
        </button>
        <Link
          href={`/app/projects/${projectId}`}
          className="text-primary hover:underline"
        >
          Volver al proyecto
        </Link>
      </div>
    </div>
  );
}
