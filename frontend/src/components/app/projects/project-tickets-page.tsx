"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { listCompanies } from "@/components/app/api/companies";
import { getProjectDetail } from "@/components/app/api/projects";
import { listTickets } from "@/components/app/api/tickets";
import { DataTable, type DataColumn } from "@/components/app/shared/data-table";
import { formatDate } from "@/components/app/shared/format";
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
import { ProjectContextHeader } from "./project-context-header";
import { ticketsModule } from "../tickets/tickets-module";

interface ProjectTicketsPageProps {
  projectId: string;
}

export function ProjectTicketsPage({ projectId }: ProjectTicketsPageProps) {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const canAccess = canAccessModule(claims, ticketsModule);

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [projectName, setProjectName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [tickets, setTickets] = React.useState<
    Awaited<ReturnType<typeof listTickets>>
  >([]);

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setTickets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [project, companies, ticketData] = await Promise.all([
        getProjectDetail(surface, projectId),
        listCompanies(surface, {}),
        listTickets(surface, { projectId }),
      ]);

      setProjectName(project.name);
      setCompanyName(
        companies.find((company) => company.id === project.companyId)?.name ?? "",
      );
      setTickets(ticketData);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los tickets del proyecto.";
      setErrorMessage(message);
      setTickets([]);
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
    (): DataColumn<(typeof tickets)[number]>[] => [
      { key: "title", label: "Título", render: (item) => item.title },
      { key: "status", label: "Estado", render: (item) => item.statusName },
      { key: "priority", label: "Prioridad", render: (item) => item.priorityName },
      {
        key: "category",
        label: "Categoría",
        render: (item) => item.categoryName ?? "Sin categoría",
      },
      {
        key: "createdAt",
        label: "Creado",
        render: (item) => formatDate(item.createdAt),
      },
    ],
    [],
  );

  if (!isAuthLoading && !canAccess) {
    return (
      <ErrorState
        message="Tu usuario no tiene permiso para ver tickets."
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
        sectionTitle="Tickets del proyecto"
        sectionDescription="Solicitudes asociadas a este proyecto."
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
          ) : tickets.length === 0 ? (
            <EmptyState
              title="No hay tickets"
              description="Este proyecto aún no tiene tickets registrados."
            />
          ) : (
            <DataTable columns={columns} data={tickets} />
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
