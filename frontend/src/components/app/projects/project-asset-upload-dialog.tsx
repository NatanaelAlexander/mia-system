"use client";

import * as React from "react";
import { FileUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadProjectAsset } from "@/components/app/api/projects";
import { formatFileSize } from "@/components/app/shared/format";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

interface ProjectAssetUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialFile?: File | null;
  onUploaded?: () => void;
}

function resolveDisplayName(customName: string, file: File): string | undefined {
  const trimmed = customName.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.includes(".")) {
    return trimmed;
  }

  const dot = file.name.lastIndexOf(".");
  const extension = dot > 0 ? file.name.slice(dot) : "";
  return `${trimmed}${extension}`;
}

function pickFile(files: FileList | null): File | null {
  if (!files?.length) {
    return null;
  }

  return files[0] ?? null;
}

export function ProjectAssetUploadDialog({
  open,
  onOpenChange,
  projectId,
  initialFile = null,
  onUploaded,
}: ProjectAssetUploadDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [displayName, setDisplayName] = React.useState("");
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("El archivo supera el límite de 50 MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    assignFile(pickFile(event.dataTransfer.files));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("Selecciona un archivo para subir.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploaded = await uploadProjectAsset(
        projectId,
        selectedFile,
        resolveDisplayName(displayName, selectedFile),
      );
      toast.success(`"${uploaded.fileName}" subido correctamente`);
      onOpenChange(false);
      onUploaded?.();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo subir el archivo.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir archivo</DialogTitle>
          <DialogDescription>
            Arrastra un archivo o selecciónalo. Puedes definir un nombre visible
            opcional antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="asset-display-name">Nombre del archivo (opcional)</Label>
            <Input
              id="asset-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={
                selectedFile
                  ? `Por defecto: ${selectedFile.name}`
                  : "Ej: Contrato firmado 2025"
              }
              disabled={isSubmitting}
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground">
              Si lo dejas vacío se usará el nombre original del archivo.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Archivo</Label>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              disabled={isSubmitting}
              onChange={(event) => {
                assignFile(pickFile(event.target.files));
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
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
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
                  <p className="text-xs text-muted-foreground">
                    Haz clic o arrastra otro archivo para reemplazarlo
                  </p>
                </>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Arrastra el archivo aquí
                    </p>
                    <p className="text-xs text-muted-foreground">
                      o haz clic para seleccionarlo
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? "Subiendo..." : "Subir archivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
