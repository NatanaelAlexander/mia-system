"use client";

import * as React from "react";
import { FileUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { formatFileSize } from "@/components/app/shared/format";
import {
  MAX_ATTACHMENT_BYTES,
  pickFirstFile,
  resolveAttachmentDisplayName,
  type PendingAttachment,
} from "@/components/app/shared/attachment-utils";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AttachmentPickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFile?: File | null;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: (attachment: PendingAttachment) => void;
}

export function AttachmentPickDialog({
  open,
  onOpenChange,
  initialFile = null,
  title = "Adjuntar archivo",
  description = "Arrastra un archivo o selecciónalo. Puedes definir un nombre visible opcional.",
  confirmLabel = "Agregar archivo",
  onConfirm,
}: AttachmentPickDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setDisplayName("");
      setIsDragging(false);
      return;
    }

    setSelectedFile(initialFile ?? null);
    setDisplayName("");
  }, [initialFile, open]);

  const assignFile = (file: File | null) => {
    if (!file) {
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("El archivo supera el límite de 50 MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleConfirm = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("Selecciona un archivo.");
      return;
    }

    onConfirm({
      file: selectedFile,
      displayName: resolveAttachmentDisplayName(displayName, selectedFile),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleConfirm}>
          <div className="space-y-2">
            <Label htmlFor="attachment-display-name">
              Nombre del archivo (opcional)
            </Label>
            <Input
              id="attachment-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={
                selectedFile
                  ? `Por defecto: ${selectedFile.name}`
                  : "Ej: Evidencia del error"
              }
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label>Archivo</Label>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                assignFile(pickFirstFile(event.target.files));
                event.target.value = "";
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                assignFile(pickFirstFile(event.dataTransfer.files));
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border/70 hover:border-primary/50 hover:bg-muted/30",
              )}
            >
              {selectedFile ? (
                <>
                  <FileUp className="size-8 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Arrastra el archivo aquí</p>
                  <p className="text-xs text-muted-foreground">
                    o haz clic para seleccionarlo
                  </p>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedFile}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
