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
import { listUsers } from "@/components/app/api/users";
import { AttachmentPickDialog } from "@/components/app/shared/attachment-pick-dialog";
import {
  getAttachmentLabel,
  pickFirstFile,
  type PendingAttachment,
} from "@/components/app/shared/attachment-utils";
import { formatDate, formatFileSize } from "@/components/app/shared/format";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ProjectContextHeader } from "../projects/project-context-header";

interface CommentWithAssets extends TicketComment {
  assets: AssetListItem[];
}

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
  const [userNames, setUserNames] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState("");
  const [isInternalComment, setIsInternalComment] = React.useState(false);
  const [pendingAttachments, setPendingAttachments] = React.useState<
    PendingAttachment[]
  >([]);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

  const openAttachmentPicker = (file?: File | null) => {
    setAttachmentInitialFile(file ?? null);
    setAttachmentPickOpen(true);
  };

  const loadThread = React.useCallback(async () => {
    if (!claims) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [project, companies, ticketData, commentData, assetsData, users] =
        await Promise.all([
        getProjectDetail(surface, projectId),
        listCompanies(surface, {}),
        getTicketDetail(surface, ticketId),
        listTicketComments(surface, ticketId),
        listTicketAssets(surface, ticketId).catch(() => [] as AssetListItem[]),
        isInternal ? listUsers({}) : Promise.resolve([]),
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
      setUserNames(
        Object.fromEntries(
          users.map((user) => [
            user.id,
            `${user.firstName} ${user.lastName}`.trim() || user.email,
          ]),
        ),
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

  const resolveAuthorName = (userId: string) => {
    if (userId === claims?.sub) {
      return "Tú";
    }

    return userNames[userId] ?? "Usuario";
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle>{ticket?.title ?? "Cargando ticket..."}</CardTitle>
              <CardDescription>
                {ticket
                  ? `${ticket.statusName} · ${ticket.priorityName}${
                      ticket.categoryName ? ` · ${ticket.categoryName}` : ""
                    }`
                  : "Detalle del ticket"}
              </CardDescription>
              {ticket?.description ? (
                <p className="text-sm text-muted-foreground">{ticket.description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
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

          <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-border/70 p-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando conversación...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay mensajes. Escribe el primero o adjunta archivos.
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    "rounded-lg border px-3 py-2",
                    comment.isInternal
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border/70 bg-muted/20",
                  )}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {resolveAuthorName(comment.userId)}
                    </span>
                    <span>{formatDate(comment.createdAt)}</span>
                    {comment.isInternal ? (
                      <Badge variant="outline" className="text-[10px]">
                        Interno
                      </Badge>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{comment.comment}</p>
                  {comment.assets.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {comment.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5 text-xs"
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
                  ) : null}
                </div>
              ))
            )}
            <div ref={threadEndRef} />
          </div>

          {typingUsers.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {typingUsers.join(", ")} está escribiendo...
            </p>
          ) : null}

          {canComment ? (
            <div
              className={cn(
                "relative space-y-3 rounded-xl border border-border/70 p-4 transition-colors",
                isComposerDragging && "border-primary ring-2 ring-primary/20",
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
                const file = pickFirstFile(event.dataTransfer.files);
                if (file) {
                  openAttachmentPicker(file);
                }
              }}
            >
              {isComposerDragging ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-primary/5">
                  <div className="rounded-lg border border-primary/40 bg-background px-3 py-2 text-xs font-medium text-primary">
                    Suelta el archivo para adjuntarlo al mensaje
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="ticket-message">Mensaje</Label>
                <textarea
                  id="ticket-message"
                  rows={3}
                  value={message}
                  disabled={isSending}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    emitTyping(event.target.value.trim().length > 0, isInternalComment);
                  }}
                  placeholder="Escribe una respuesta..."
                  className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                />
              </div>

              {canPostInternal ? (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <div className="space-y-2">
                  {pendingAttachments.map((attachment, index) => (
                    <div
                      key={`${getAttachmentLabel(attachment)}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-dashed px-2 py-1.5 text-sm"
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

              <div className="flex flex-wrap items-center gap-2">
                {canUpload ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSending}
                    onClick={() => openAttachmentPicker()}
                  >
                    <Paperclip />
                    Adjuntar
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    isSending ||
                    (!message.trim() && pendingAttachments.length === 0)
                  }
                  onClick={() => void handleSend()}
                >
                  <Send />
                  {isSending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Arrastra archivos aquí o usa Adjuntar. Máximo 50 MB por archivo.
              </p>
            </div>
          ) : null}
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
