"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { listCompanies } from "@/components/app/api/companies";
import { getProjectDetail, listProjectAssets } from "@/components/app/api/projects";
import { DataTable, type DataColumn } from "@/components/app/shared/data-table";
import { formatDate, formatFileSize } from "@/components/app/shared/format";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import { canAccessModule } from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { assetsModule } from "../assets/assets-module";
import { ProjectContextHeader } from "./project-context-header";

interface ProjectAssetsPageProps {
  projectId: string;
}

export function ProjectAssetsPage({ projectId }: ProjectAssetsPageProps) {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const canAccess = canAccessModule(claims, assetsModule);

  const [isLoading, setIsLoading] = React.useState(true);
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
    <div className="mx-auto max-w-5xl space-y-6">
      <ProjectContextHeader
        projectId={projectId}
        projectName={projectName || "Proyecto"}
        companyName={companyName}
        sectionTitle="Archivos del proyecto"
        sectionDescription="Documentos vinculados a este proyecto."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Listado</CardTitle>
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
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading || isAuthLoading ? (
            <ListSkeleton columns={columns.length} />
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={reload} />
          ) : assets.length === 0 ? (
            <EmptyState
              title="No hay archivos"
              description="Este proyecto aún no tiene archivos vinculados."
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
  );
}
