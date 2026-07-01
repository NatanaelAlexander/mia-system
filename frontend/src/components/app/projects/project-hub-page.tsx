"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listCompanies } from "@/components/app/api/companies";
import { getProjectDetail } from "@/components/app/api/projects";
import { ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import { canAccessModule } from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { projectsModule } from "./projects-module";
import { ProjectHubPanel } from "./project-hub-panel";

interface ProjectHubPageProps {
  projectId: string;
}

export function ProjectHubPage({ projectId }: ProjectHubPageProps) {
  const router = useRouter();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const canAccess = canAccessModule(claims, projectsModule);

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [companyName, setCompanyName] = React.useState("—");
  const [project, setProject] = React.useState<
    Awaited<ReturnType<typeof getProjectDetail>> | null
  >(null);

  const loadProject = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setProject(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [projectData, companies] = await Promise.all([
        getProjectDetail(surface, projectId),
        listCompanies(surface, {}),
      ]);

      setProject(projectData);
      setCompanyName(
        companies.find((company) => company.id === projectData.companyId)?.name ??
          "—",
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cargar el proyecto.";
      setErrorMessage(message);
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, claims, projectId, surface]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void loadProject();
    }
  }, [isAuthLoading, loadProject]);

  if (isAuthLoading || isLoading) {
    return <ListSkeleton columns={1} rows={4} />;
  }

  if (!canAccess || errorMessage || !project) {
    return (
      <div className="space-y-4">
        <Link
          href="/app/projects"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft />
          Proyectos
        </Link>
        <ErrorState
          message={errorMessage ?? "Proyecto no disponible."}
          onRetry={loadProject}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/app/projects"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        <ArrowLeft />
        Proyectos
      </Link>

      <ProjectHubPanel
        project={project}
        companyName={companyName}
        onUpdated={(updated) => {
          setProject(updated);
          if (updated.status !== "active") {
            router.refresh();
          }
        }}
      />
    </div>
  );
}
