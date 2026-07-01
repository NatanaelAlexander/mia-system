"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCcw, Upload } from "lucide-react";
import { listCompanies } from "@/components/app/api/companies";
import { getProjectDetail, listProjectAssets } from "@/components/app/api/projects";
import { DataTable, type DataColumn } from "@/components/app/shared/data-table";
import { formatDate, formatFileSize } from "@/components/app/shared/format";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import { canAccessModule, hasPermission } from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
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
import { assetsModule } from "../assets/assets-module";
import { ProjectAssetUploadDialog } from "./project-asset-upload-dialog";
import { ProjectContextHeader } from "./project-context-header";

interface ProjectAssetsPageProps {
  projectId: string;
}

function pickDroppedFile(files: FileList | null): File | null {
  if (!files?.length) {
    return null;
  }

  return files[0] ?? null;
}

export function ProjectAssetsPage({ projectId }: ProjectAssetsPageProps) {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const canAccess = canAccessModule(claims, assetsModule);
  const canUpload = hasPermission(claims, "assets:create");

  const [isLoading, setIsLoading] = React.useState(true);
  const [isPageDragging, setIsPageDragging] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadInitialFile, setUploadInitialFile] = React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [projectName, setProjectName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [assets, setAssets] = React.useState<
    Awaited<ReturnType<typeof listProjectAssets>>
  >([]);

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setAssets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [project, companies, assetData] = await Promise.all([
        getProjectDetail(surface, projectId),
        listCompanies(surface, {}),
        listProjectAssets(projectId),
      ]);

      setProjectName(project.name);
      setCompanyName(
        companies.find((company) => company.id === project.companyId)?.name ?? "",
      );
      setAssets(assetData);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los archivos del proyecto.";
      setErrorMessage(message);
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, claims, projectId, surface]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void reload();
    }
  }, [isAuthLoading, reload]);

  const openUploadDialog = (file?: File | null) => {
    setUploadInitialFile(file ?? null);
    setUploadOpen(true);
  };

  const handlePageDragOver = (event: React.DragEvent) => {
    if (!canUpload || uploadOpen) {
      return;
    }

    event.preventDefault();
    setIsPageDragging(true);
  };

  const handlePageDragLeave = (event: React.DragEvent) => {
    event.preventDefault();

    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsPageDragging(false);
  };

  const handlePageDrop = (event: React.DragEvent) => {
    if (!canUpload || uploadOpen) {
      return;
    }

    event.preventDefault();
    setIsPageDragging(false);
    openUploadDialog(pickDroppedFile(event.dataTransfer.files));
  };

  const columns = React.useMemo(
    (): DataColumn<(typeof assets)[number]>[] => [
      { key: "fileName", label: "Archivo", render: (item) => item.fileName },
      { key: "mimeType", label: "Tipo", render: (item) => item.mimeType ?? "—" },
      {
        key: "fileSize",
        label: "Tamaño",
        render: (item) => formatFileSize(item.fileSize),
      },
      {
        key: "createdAt",
        label: "Subido",
        render: (item) => formatDate(item.createdAt),
      },
    ],
    [],
  );

  if (!isAuthLoading && !canAccess) {
    return (
      <ErrorState
        message="Tu usuario no tiene permiso para ver archivos."
        onRetry={reload}
      />
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6">
        <ProjectContextHeader
          projectId={projectId}
          projectName={projectName || "Proyecto"}
          companyName={companyName}
          sectionTitle="Archivos del proyecto"
          sectionDescription="Documentos vinculados a este proyecto."
        />

        <Card
          className={cn(
            "relative transition-colors",
            isPageDragging && "border-primary ring-2 ring-primary/20",
          )}
          onDragOver={handlePageDragOver}
          onDragLeave={handlePageDragLeave}
          onDrop={handlePageDrop}
        >
          {isPageDragging ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-primary/5 backdrop-blur-[1px]">
              <div className="rounded-lg border border-primary/40 bg-background px-4 py-3 text-sm font-medium text-primary shadow-sm">
                Suelta el archivo para subirlo al proyecto
              </div>
            </div>
          ) : null}

          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Listado</CardTitle>
                <CardDescription>
                  PDF, Office, imágenes, audio, video y ZIP. Máximo 50 MB por
                  archivo.
                  {canUpload
                    ? " Arrastra un archivo aquí o usa el botón de subir."
                    : null}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {canUpload ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => openUploadDialog()}
                  >
                    <Upload />
                    Subir archivo
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={reload}
                  disabled={isLoading}
                >
                  <RefreshCcw />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading || isAuthLoading ? (
              <ListSkeleton columns={columns.length} />
            ) : errorMessage ? (
              <ErrorState message={errorMessage} onRetry={reload} />
            ) : assets.length === 0 ? (
              <EmptyState
                title="No hay archivos"
                description={
                  canUpload
                    ? "Sube el primer archivo con el botón o arrastrándolo a esta sección."
                    : "Este proyecto aún no tiene archivos vinculados."
                }
              />
            ) : (
              <DataTable columns={columns} data={assets} />
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <Link href={`/app/projects/${projectId}`} className="text-primary hover:underline">
            Volver al detalle del proyecto
          </Link>
        </div>
      </div>

      {canUpload ? (
        <ProjectAssetUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          projectId={projectId}
          initialFile={uploadInitialFile}
          onUploaded={reload}
        />
      ) : null}
    </>
  );
}
