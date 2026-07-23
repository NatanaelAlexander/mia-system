"use client";

import * as React from "react";
import {
  ChevronRight,
  Download,
  File,
  Folder,
  FolderPlus,
  Pencil,
  RefreshCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  createCompanyFolder,
  deleteCompanyFile,
  deleteCompanyFolder,
  getCompanyFileDownloadUrl,
  listCompanyFolderContents,
  renameCompanyFolder,
  type CompanyFileItem,
  type CompanyFolderContents,
  type CompanyFolderItem,
} from "@/components/app/api/company-files";
import { ConfirmDialog } from "@/components/app/shared/confirm-dialog";
import { formatDate, formatFileSize } from "@/components/app/shared/format";
import { HelpHint } from "@/components/app/shared/help-hint";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/app/shared/list-states";
import { hasPermission } from "@/components/app/shared/permissions";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { CompanyFileUploadDialog } from "./company-file-upload-dialog";

interface CompanyFilesDriveSectionProps {
  companyId: string;
  helpText: string;
}

function pickDroppedFile(files: FileList | null): File | null {
  if (!files?.length) {
    return null;
  }
  return files[0] ?? null;
}

export function CompanyFilesDriveSection({
  companyId,
  helpText,
}: CompanyFilesDriveSectionProps) {
  const { claims } = useAuth();
  const canRead = hasPermission(claims, "company_files:read");
  const canCreate = hasPermission(claims, "company_files:create");
  const canUpdate = hasPermission(claims, "company_files:update");
  const canDelete = hasPermission(claims, "company_files:delete");

  const [folderId, setFolderId] = React.useState<string | null>(null);
  const [contents, setContents] = React.useState<CompanyFolderContents | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPageDragging, setIsPageDragging] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadInitialFile, setUploadInitialFile] = React.useState<File | null>(
    null,
  );
  const [folderDialogOpen, setFolderDialogOpen] = React.useState(false);
  const [folderDialogMode, setFolderDialogMode] = React.useState<
    "create" | "rename"
  >("create");
  const [folderName, setFolderName] = React.useState("");
  const [renameTarget, setRenameTarget] = React.useState<CompanyFolderItem | null>(
    null,
  );
  const [isFolderSubmitting, setIsFolderSubmitting] = React.useState(false);
  const [deleteFolderTarget, setDeleteFolderTarget] =
    React.useState<CompanyFolderItem | null>(null);
  const [deleteFileTarget, setDeleteFileTarget] =
    React.useState<CompanyFileItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadingAssetId, setDownloadingAssetId] = React.useState<
    string | null
  >(null);

  const reload = React.useCallback(async () => {
    if (!canRead) {
      setContents(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await listCompanyFolderContents(companyId, folderId);
      setContents(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cargar el drive de la empresa.";
      setErrorMessage(message);
      setContents(null);
    } finally {
      setIsLoading(false);
    }
  }, [canRead, companyId, folderId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const openUploadDialog = (file?: File | null) => {
    setUploadInitialFile(file ?? null);
    setUploadOpen(true);
  };

  const openCreateFolder = () => {
    setFolderDialogMode("create");
    setRenameTarget(null);
    setFolderName("");
    setFolderDialogOpen(true);
  };

  const openRenameFolder = (folder: CompanyFolderItem) => {
    setFolderDialogMode("rename");
    setRenameTarget(folder);
    setFolderName(folder.name);
    setFolderDialogOpen(true);
  };

  const handleFolderSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsFolderSubmitting(true);
    try {
      if (folderDialogMode === "create") {
        await createCompanyFolder(companyId, trimmed, folderId);
        toast.success("Carpeta creada");
      } else if (renameTarget) {
        await renameCompanyFolder(renameTarget.id, trimmed);
        toast.success("Carpeta renombrada");
      }
      setFolderDialogOpen(false);
      await reload();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar la carpeta.";
      toast.error(message);
    } finally {
      setIsFolderSubmitting(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCompanyFolder(deleteFolderTarget.id);
      toast.success("Carpeta eliminada");
      setDeleteFolderTarget(null);
      await reload();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo eliminar la carpeta.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!deleteFileTarget) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCompanyFile(deleteFileTarget.id);
      toast.success("Archivo eliminado");
      setDeleteFileTarget(null);
      await reload();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo eliminar el archivo.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (file: CompanyFileItem) => {
    setDownloadingAssetId(file.id);
    try {
      const { url } = await getCompanyFileDownloadUrl(file.id);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.fileName;
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
    } finally {
      setDownloadingAssetId(null);
    }
  };

  if (!canRead) {
    return (
      <p className="text-sm text-muted-foreground">
        No tienes permiso para ver el drive general.
      </p>
    );
  }

  const folders = contents?.folders ?? [];
  const files = contents?.files ?? [];
  const breadcrumb = contents?.breadcrumb ?? [];
  const isEmpty = !isLoading && !errorMessage && folders.length === 0 && files.length === 0;

  return (
    <div
      className="space-y-4"
      onDragOver={(event) => {
        if (!canCreate || uploadOpen) return;
        event.preventDefault();
        setIsPageDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && event.currentTarget.contains(nextTarget)) {
          return;
        }
        setIsPageDragging(false);
      }}
      onDrop={(event) => {
        if (!canCreate || uploadOpen) return;
        event.preventDefault();
        setIsPageDragging(false);
        openUploadDialog(pickDroppedFile(event.dataTransfer.files));
      }}
    >
      <Card
        className={cn(
          isPageDragging && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
        )}
      >
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Folder className="size-4 text-primary" />
              Drive general
              <HelpHint label="Qué es el drive general" text={helpText} />
            </CardTitle>
            <CardDescription>
              Carpetas y archivos de la empresa. Máximo 50 MB por archivo.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void reload()}
              disabled={isLoading}
            >
              <RefreshCcw />
              Actualizar
            </Button>
            {canCreate ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openCreateFolder}
                >
                  <FolderPlus />
                  Nueva carpeta
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openUploadDialog()}
                >
                  <Upload />
                  Subir archivo
                </Button>
              </>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <nav
            aria-label="Ruta de carpetas"
            className="flex flex-wrap items-center gap-1 text-sm"
          >
            <button
              type="button"
              className={cn(
                "rounded-md px-1.5 py-0.5 font-medium transition-colors",
                folderId
                  ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                  : "bg-muted text-foreground",
              )}
              onClick={() => setFolderId(null)}
            >
              Raíz
            </button>
            {breadcrumb.map((item) => (
              <React.Fragment key={item.id}>
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-medium transition-colors",
                    folderId === item.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={() => setFolderId(item.id)}
                >
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {isLoading ? <ListSkeleton rows={4} /> : null}
          {!isLoading && errorMessage ? (
            <ErrorState message={errorMessage} onRetry={reload} />
          ) : null}
          {isEmpty ? (
            <EmptyState
              title="Sin archivos ni carpetas"
              description={
                canCreate
                  ? "Crea una carpeta o sube el primer archivo."
                  : "Esta ubicación está vacía."
              }
            />
          ) : null}

          {!isLoading && !errorMessage && !isEmpty ? (
            <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
              {folders.map((folder) => (
                <li
                  key={folder.id}
                  className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    className="inline-flex min-w-0 items-center gap-2 text-left hover:text-primary"
                    onClick={() => setFolderId(folder.id)}
                  >
                    <Folder className="size-4 shrink-0 text-primary" />
                    <span className="truncate font-medium">{folder.name}</span>
                  </button>
                  <div className="flex flex-wrap items-center gap-1">
                    {canUpdate ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openRenameFolder(folder)}
                      >
                        <Pencil />
                        Renombrar
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteFolderTarget(folder)}
                      >
                        <Trash2 />
                        Eliminar
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="inline-flex items-center gap-2 truncate font-medium">
                      <File className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{file.fileName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)} · {formatDate(file.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={downloadingAssetId === file.id}
                      onClick={() => void handleDownload(file)}
                    >
                      <Download />
                      Descargar
                    </Button>
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteFileTarget(file)}
                      >
                        <Trash2 />
                        Eliminar
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <CompanyFileUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        companyId={companyId}
        folderId={folderId}
        initialFile={uploadInitialFile}
        onUploaded={() => void reload()}
      />

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleFolderSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {folderDialogMode === "create"
                  ? "Nueva carpeta"
                  : "Renombrar carpeta"}
              </DialogTitle>
              <DialogDescription>
                El nombre debe ser único dentro de esta ubicación.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="company-folder-name">Nombre</Label>
              <Input
                id="company-folder-name"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                autoFocus
                disabled={isFolderSubmitting}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFolderDialogOpen(false)}
                disabled={isFolderSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isFolderSubmitting}>
                {isFolderSubmitting ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteFolderTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteFolderTarget(null);
        }}
        title="Eliminar carpeta"
        description={`¿Eliminar "${deleteFolderTarget?.name ?? ""}" y todo su contenido (subcarpetas y archivos)? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteFolder}
        isConfirming={isDeleting}
      />

      <ConfirmDialog
        open={Boolean(deleteFileTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteFileTarget(null);
        }}
        title="Eliminar archivo"
        description={`¿Eliminar "${deleteFileTarget?.fileName ?? ""}"? Se borrará también de R2.`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteFile}
        isConfirming={isDeleting}
      />
    </div>
  );
}
