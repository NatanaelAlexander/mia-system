"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  createTicket,
  listTicketCategories,
  listTicketPaymentStatuses,
  listTicketPriorities,
  uploadTicketAsset,
} from "@/components/app/api/tickets";
import { AttachmentPickDialog } from "@/components/app/shared/attachment-pick-dialog";
import {
  getAttachmentLabel,
  pickFirstFile,
  type PendingAttachment,
} from "@/components/app/shared/attachment-utils";
import { formatFileSize } from "@/components/app/shared/format";
import { hasPermission } from "@/components/app/shared/permissions";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TicketCreateForm, type CreateTicketFormValues } from "./ticket-form";

interface TicketCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  surface: "internal" | "portal";
  onCreated?: () => void;
}

export function TicketCreateDialog({
  open,
  onOpenChange,
  projectId,
  surface,
  onCreated,
}: TicketCreateDialogProps) {
  const router = useRouter();
  const { claims } = useAuth();
  const canUpload = hasPermission(claims, "assets:create");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [attachmentPickOpen, setAttachmentPickOpen] = React.useState(false);
  const [attachmentInitialFile, setAttachmentInitialFile] =
    React.useState<File | null>(null);
  const [pendingAttachments, setPendingAttachments] = React.useState<
    PendingAttachment[]
  >([]);
  const [priorities, setPriorities] = React.useState<
    Awaited<ReturnType<typeof listTicketPriorities>>
  >([]);
  const [categories, setCategories] = React.useState<
    Awaited<ReturnType<typeof listTicketCategories>>
  >([]);
  const [paymentStatuses, setPaymentStatuses] = React.useState<
    Awaited<ReturnType<typeof listTicketPaymentStatuses>>
  >([]);

  React.useEffect(() => {
    if (!open) {
      setPendingAttachments([]);
      setIsDragging(false);
      return;
    }

    let cancelled = false;

    async function loadCatalogs() {
      setIsLoadingCatalogs(true);

      try {
        const [priorityData, categoryData] = await Promise.all([
          listTicketPriorities(surface),
          listTicketCategories(surface),
        ]);

        const paymentData =
          surface === "internal" ? await listTicketPaymentStatuses() : [];

        if (!cancelled) {
          setPriorities(priorityData);
          setCategories(categoryData);
          setPaymentStatuses(paymentData);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError
              ? error.message
              : "No se pudieron cargar los catálogos del ticket.";
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCatalogs(false);
        }
      }
    }

    void loadCatalogs();

    return () => {
      cancelled = true;
    };
  }, [open, surface]);

  const openAttachmentPicker = (file?: File | null) => {
    setAttachmentInitialFile(file ?? null);
    setAttachmentPickOpen(true);
  };

  const handleDialogDragOver = (event: React.DragEvent) => {
    if (!canUpload || attachmentPickOpen) {
      return;
    }

    event.preventDefault();
    setIsDragging(true);
  };

  const handleDialogDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsDragging(false);
  };

  const handleDialogDrop = (event: React.DragEvent) => {
    if (!canUpload || attachmentPickOpen) {
      return;
    }

    event.preventDefault();
    setIsDragging(false);
    const file = pickFirstFile(event.dataTransfer.files);
    if (file) {
      openAttachmentPicker(file);
    }
  };

  const handleSubmit = async (values: CreateTicketFormValues) => {
    setIsSubmitting(true);

    try {
      const ticket = await createTicket(surface, {
        projectId,
        title: values.title.trim(),
        description: values.description,
        priorityId: values.priorityId,
        categoryId: values.categoryId,
        paymentStatusId: values.paymentStatusId,
      });

      if (canUpload && pendingAttachments.length > 0) {
        const failed: string[] = [];

        for (const attachment of pendingAttachments) {
          try {
            await uploadTicketAsset(
              surface,
              ticket.id,
              attachment.file,
              attachment.displayName,
            );
          } catch {
            failed.push(getAttachmentLabel(attachment));
          }
        }

        if (failed.length > 0) {
          toast.error(
            `Ticket creado, pero fallaron ${failed.length} archivo(s): ${failed.join(", ")}`,
          );
        }
      }

      toast.success("Ticket creado correctamente");
      onOpenChange(false);
      onCreated?.();
      router.push(`/app/projects/${projectId}/tickets/${ticket.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el ticket.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div
            className={cn(
              "relative -m-4 flex flex-col gap-4 p-4",
              isDragging && "rounded-xl ring-2 ring-primary/30",
            )}
            onDragOver={handleDialogDragOver}
            onDragLeave={handleDialogDragLeave}
            onDrop={handleDialogDrop}
          >
            {isDragging ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-primary/5">
                <div className="rounded-lg border border-primary/40 bg-background px-4 py-3 text-sm font-medium text-primary">
                  Suelta el archivo para adjuntarlo al ticket
                </div>
              </div>
            ) : null}

          <DialogHeader>
            <DialogTitle>Nuevo ticket</DialogTitle>
            <DialogDescription>
              Abre una solicitud en este proyecto. Puedes arrastrar archivos o
              adjuntarlos con nombre opcional.
            </DialogDescription>
          </DialogHeader>

          {isLoadingCatalogs ? (
            <p className="text-sm text-muted-foreground">Cargando catálogos...</p>
          ) : priorities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay prioridades configuradas para crear tickets.
            </p>
          ) : (
            <div className="space-y-4">
              <TicketCreateForm
                key={open ? "ticket-create-open" : "ticket-create-closed"}
                priorities={priorities}
                categories={categories}
                paymentStatuses={paymentStatuses}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />

              {canUpload ? (
                <div className="space-y-2 border-t border-border/70 pt-4">
                  <Label>Archivos adjuntos (opcional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => openAttachmentPicker()}
                  >
                    <Paperclip />
                    Adjuntar archivo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Arrastra archivos sobre este cuadro o usa el botón. Máximo 50
                    MB por archivo.
                  </p>

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
                            disabled={isSubmitting}
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
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-muted-foreground">
                      <Upload className="size-6" />
                      <p className="text-xs">
                        Arrastra archivos aquí para adjuntarlos al ticket
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {canUpload ? (
        <AttachmentPickDialog
          open={attachmentPickOpen}
          onOpenChange={setAttachmentPickOpen}
          initialFile={attachmentInitialFile}
          title="Adjuntar al ticket"
          description="Define un nombre visible opcional antes de agregar el archivo al ticket."
          confirmLabel="Agregar al ticket"
          onConfirm={(attachment) =>
            setPendingAttachments((current) => [...current, attachment])
          }
        />
      ) : null}
    </>
  );
}
