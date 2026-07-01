"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Paperclip,
  RefreshCcw,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getAssetDownloadUrl } from "@/components/app/api/assets";
import type { AssetListItem } from "@/components/app/api/assets";
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
} from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { useTicketRealtime } from "@/hooks/use-ticket-realtime";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { ProjectContextHeader } from "../projects/project-context-header";
import {
  TicketChatMessage,
  TicketChatTypingIndicator,
  type TicketChatComment,
} from "./ticket-chat-message";

interface CommentWithAssets extends TicketChatComment {}

interface TicketDetailPageProps {
  projectId: string;
  ticketId: string;
}

function mergeComments(
  current: CommentWithAssets[],
  incoming: TicketComment,
): CommentWithAssets[] {
  if (current.some((item) => item.id === incoming.id)) {
    return current;
  }

  return [...current, { ...incoming, assets: [] }].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
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

export function TicketDetailPage({ projectId, ticketId }: TicketDetailPageProps) {
  const router = useRouter();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const isInternal = isInternalUser(claims);
  const canComment = hasPermission(claims, "ticket_comments:create");
  const canUpload = hasPermission(claims, "assets:create");
  const canDownload = hasPermission(claims, "assets:read");
  const canPostInternal = isInternal && hasPermission(claims, "ticket_comments:create");

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
  const [comments, setComments] = React.useState<CommentWithAssets[]>([]);
  const [ticketAssets, setTicketAssets] = React.useState<AssetListItem[]>([]);
  const [message, setMessage] = React.useState("");
  const [isInternalComment, setIsInternalComment] = React.useState(false);
  const [pendingAttachments, setPendingAttachments] = React.useState<
    PendingAttachment[]
  >([]);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

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
        listTicketAssets(surface, ticketId).catch(() => [] as AssetListItem[]),
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
      setCompanyName(
        companies.find((company) => company.id === project.companyId)?.name ?? "",
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
  }, [claims, isInternal, projectId, surface, ticketId]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void loadThread();
    }
  }, [isAuthLoading, loadThread]);

  React.useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleRealtimeComment = React.useCallback((comment: TicketComment) => {
    if (comment.isInternal && !isInternal) {
      return;
    }

    setComments((current) => mergeComments(current, comment));
  }, [isInternal]);

  const { isConnected, emitTyping } = useTicketRealtime({
    ticketId,
    enabled: Boolean(claims && ticket),
    onCommentCreated: handleRealtimeComment,
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
      const { url } = await getAssetDownloadUrl(asset.id);
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

    try {
      const created = await addTicketComment(surface, {
        ticketId,
        comment: trimmed || "(archivo adjunto)",
        isInternal: canPostInternal ? isInternalComment : false,
      });

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
        mergeComments(current, { ...created, assets: uploadedAssets }),
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
      setIsSending(false);
    }
  };

  if (!isAuthLoading && errorMessage && !ticket) {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={loadThread}
      />
    );
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

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {ticket ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TicketMetaField label="Estado" value={ticket.statusName} />
                <TicketMetaField label="Prioridad" value={ticket.priorityName} />
                {ticket.categoryName ? (
                  <TicketMetaField label="Categoría" value={ticket.categoryName} />
                ) : null}
                {ticket.paymentStatusName ? (
                  <TicketMetaField label="Pago" value={ticket.paymentStatusName} />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Cargando detalle del ticket...</p>
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

          <div className="flex max-h-[32rem] min-h-[18rem] flex-col overflow-hidden rounded-xl border border-border/70 bg-background/40">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando conversación...</p>
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
                "relative border-t border-border/70 bg-card/60 p-3 transition-colors",
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
                    onChange={(event) => setIsInternalComment(event.target.checked)}
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
                            current.filter((_, itemIndex) => itemIndex !== index),
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
                    emitTyping(event.target.value.trim().length > 0, isInternalComment);
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
        <Link href={`/app/projects/${projectId}`} className="text-primary hover:underline">
          Volver al proyecto
        </Link>
      </div>
    </div>
  );
}
