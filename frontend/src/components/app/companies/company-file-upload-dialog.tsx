"use client";

import * as React from "react";
import { FileUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadCompanyFile } from "@/components/app/api/company-files";
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

interface CompanyFileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  folderId?: string | null;
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

export function CompanyFileUploadDialog({
  open,
  onOpenChange,
  companyId,
  folderId = null,
  initialFile = null,
  onUploaded,
}: CompanyFileUploadDialogProps) {
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
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("El archivo supera el máximo de 50 MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error("Selecciona un archivo");
      return;
    }

    setIsSubmitting(true);
    try {
      await uploadCompanyFile(
        companyId,
        selectedFile,
        folderId,
        resolveDisplayName(displayName, selectedFile),
      );
      toast.success("Archivo subido");
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
      <DialogContent className="overflow-hidden sm:max-w-md">
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <DialogHeader>
            <DialogTitle>Subir archivo</DialogTitle>
            <DialogDescription>
              Máximo 50 MB por archivo. Se guarda en el drive de la empresa (R2).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="company-file-display-name">
              Nombre visible (opcional)
            </Label>
            <Input
              id="company-file-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Sin valor usa el nombre del archivo"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="button"
            className={cn(
              "flex w-full min-w-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border/80 bg-muted/20 hover:bg-muted/40",
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              assignFile(pickFile(event.dataTransfer.files));
            }}
            disabled={isSubmitting}
          >
            <Upload className="size-5 shrink-0 text-primary" />
            <span
              className="w-full max-w-full truncate px-1 text-sm font-medium"
              title={selectedFile?.name}
            >
              {selectedFile
                ? selectedFile.name
                : "Arrastra un archivo o haz clic para elegir"}
            </span>
            {selectedFile ? (
              <span className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </span>
            ) : null}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => assignFile(pickFile(event.target.files))}
          />

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
              <FileUp />
              {isSubmitting ? "Subiendo…" : "Subir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
