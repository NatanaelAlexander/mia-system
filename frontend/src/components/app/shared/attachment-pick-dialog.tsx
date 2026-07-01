"use client";

import * as React from "react";
import { FileUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { formatFileSize } from "@/components/app/shared/format";
import {
  collectFiles,
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

function rejectOversized(file: File) {
  toast.error(`"${file.name}" supera el límite de 50 MB.`);
}

export function AttachmentPickDialog({
  open,
  onOpenChange,
  initialFile = null,
  title = "Adjuntar archivo",
  description = "Arrastra archivos o selecciónalos. Puedes definir un nombre visible opcional si adjuntas uno solo.",
  confirmLabel = "Agregar archivo",
  onConfirm,
}: AttachmentPickDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [displayName, setDisplayName] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);

  const singleFile = selectedFiles.length === 1 ? selectedFiles[0] : null;

  React.useEffect(() => {
    if (!open) {
      setSelectedFiles([]);
      setDisplayName("");
      setIsDragging(false);
      return;
    }

    setSelectedFiles(initialFile ? [initialFile] : []);
    setDisplayName("");
  }, [initialFile, open]);

  const assignFiles = (files: FileList | null) => {
    const collected = collectFiles(files, { onRejected: rejectOversized });
    if (collected.length > 0) {
      setSelectedFiles(collected);
      setDisplayName("");
    }
  };

  const handleConfirm = (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      toast.error("Selecciona al menos un archivo.");
      return;
    }

    if (singleFile) {
      onConfirm({
        file: singleFile,
        displayName: resolveAttachmentDisplayName(displayName, singleFile),
      });
    } else {
      for (const file of selectedFiles) {
        onConfirm({ file });
      }
    }

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
          {singleFile ? (
            <div className="space-y-2">
              <Label htmlFor="attachment-display-name">
                Nombre del archivo (opcional)
              </Label>
              <Input
                id="attachment-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={`Por defecto: ${singleFile.name}`}
                maxLength={255}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Archivo{selectedFiles.length === 0 ? "s" : ""}</Label>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                assignFiles(event.target.files);
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
                assignFiles(event.dataTransfer.files);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border/70 hover:border-primary/50 hover:bg-muted/30",
              )}
            >
              {selectedFiles.length > 0 ? (
                <>
                  <FileUp className="size-8 text-primary" />
                  {selectedFiles.length === 1 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{selectedFiles[0].name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFiles[0].size)}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full space-y-2 text-left">
                      <p className="text-center text-sm font-medium">
                        {selectedFiles.length} archivos seleccionados
                      </p>
                      <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                        {selectedFiles.map((file) => (
                          <li key={`${file.name}-${file.size}`} className="truncate">
                            {file.name} ({formatFileSize(file.size)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Haz clic o arrastra para cambiar la selección
                  </p>
                </>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Arrastra archivos aquí</p>
                  <p className="text-xs text-muted-foreground">
                    o haz clic para seleccionarlos (varios a la vez)
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
            <Button type="submit" disabled={selectedFiles.length === 0}>
              {selectedFiles.length > 1
                ? `Agregar ${selectedFiles.length} archivos`
                : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
