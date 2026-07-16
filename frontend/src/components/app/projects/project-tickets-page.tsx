"use client";

import * as React from "react";
import Link from "next/link";
import { listCompanies } from "@/components/app/api/companies";
import { getProjectDetail } from "@/components/app/api/projects";
import { ErrorState } from "@/components/app/shared/list-states";
import { canAccessModule } from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { ProjectContextHeader } from "./project-context-header";
import { ProjectTicketsSection } from "./project-tickets-section";
import { ticketsModule } from "../tickets/tickets-module";

interface ProjectTicketsPageProps {
  projectId: string;
}

export function ProjectTicketsPage({ projectId }: ProjectTicketsPageProps) {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const canAccess = canAccessModule(claims, ticketsModule);

  const [projectName, setProjectName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadContext = React.useCallback(async () => {
    if (!claims || !canAccess) {
      return;
    }

    setErrorMessage(null);

    try {
      const [project, companies] = await Promise.all([
        getProjectDetail(surface, projectId),
        listCompanies(surface, {}),
      ]);

      setProjectName(project.name);
      setCompanyName(
        companies.find((company) => company.id === project.companyId)?.name ?? "",
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cargar el proyecto.";
      setErrorMessage(message);
    }
  }, [canAccess, claims, projectId, surface]);

  React.useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void loadContext();
  }, [isAuthLoading, loadContext]);

  if (!isAuthLoading && !canAccess) {
    return (
      <ErrorState message="Tu usuario no tiene permiso para ver tickets." />
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <ProjectContextHeader
        projectId={projectId}
        projectName={projectName || "Proyecto"}
        companyName={companyName}
        sectionTitle="Tickets del proyecto"
        sectionDescription="Tablero kanban por estado."
      />

      {errorMessage ? (
        <ErrorState message={errorMessage} onRetry={loadContext} />
      ) : null}

      <ProjectTicketsSection projectId={projectId} surface={surface} />

      <div className="text-sm text-muted-foreground">
        <Link
          href={`/app/projects/${projectId}`}
          className="text-primary hover:underline"
        >
          Volver al detalle del proyecto
        </Link>
      </div>
    </div>
  );
}
