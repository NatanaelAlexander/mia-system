"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  LayoutGrid,
} from "lucide-react";
import { listCompanies } from "@/components/app/api/companies";
import { getProjectDetail } from "@/components/app/api/projects";
import { companyDetailHref } from "@/components/app/companies/companies-module";
import { ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import { canAccessModule } from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { projectsModule } from "./projects-module";
import {
  ProjectGeneralFields,
  ProjectHubPanel,
} from "./project-hub-panel";
import { ProjectTicketsSection } from "./project-tickets-section";
import { EntityQuotesList } from "@/components/app/quotes/company-quotes-section";
import { quotesModule } from "@/components/app/quotes/quotes-module";
import { ticketsModule } from "@/components/app/tickets/tickets-module";

interface ProjectHubPageProps {
  projectId: string;
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-primary" />
      <span>{label}</span>
    </span>
  );
}

export function ProjectHubPage({ projectId }: ProjectHubPageProps) {
  const router = useRouter();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const canAccess = canAccessModule(claims, projectsModule);
  const canViewQuotes = canAccessModule(claims, quotesModule);
  const canViewTickets = canAccessModule(claims, ticketsModule);

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [companyName, setCompanyName] = React.useState("—");
  const [project, setProject] = React.useState<
    Awaited<ReturnType<typeof getProjectDetail>> | null
  >(null);

  const backHref = project
    ? companyDetailHref(project.companyId, "proyectos")
    : "/app/companies";

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
          href="/app/companies"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft />
          Empresas
        </Link>
        <ErrorState
          message={errorMessage ?? "Proyecto no disponible."}
          onRetry={loadProject}
        />
      </div>
    );
  }

  const openSections = [
    "datos",
    ...(canViewQuotes ? (["cotizaciones"] as const) : []),
    ...(canViewTickets ? (["tickets"] as const) : []),
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <Link
        href={backHref}
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

      <Accordion
        multiple
        defaultValue={openSections}
        className="gap-4"
      >
        <AccordionItem value="datos">
          <AccordionTrigger>
            <SectionTitle icon={LayoutGrid} label="Datos generales" />
          </AccordionTrigger>
          <AccordionPanel>
            <ProjectGeneralFields project={project} />
          </AccordionPanel>
        </AccordionItem>

        {canViewQuotes ? (
          <AccordionItem value="cotizaciones">
            <AccordionTrigger>
              <SectionTitle icon={FileText} label="Cotizaciones del proyecto" />
            </AccordionTrigger>
            <AccordionPanel>
              <EntityQuotesList
                companyId={project.companyId}
                projectId={project.id}
              />
            </AccordionPanel>
          </AccordionItem>
        ) : null}

        {canViewTickets ? (
          <AccordionItem value="tickets">
            <AccordionTrigger>
              <SectionTitle icon={ClipboardList} label="Tickets" />
            </AccordionTrigger>
            <AccordionPanel>
              <ProjectTicketsSection
                projectId={project.id}
                surface={surface}
                embedded
              />
            </AccordionPanel>
          </AccordionItem>
        ) : null}
      </Accordion>
    </div>
  );
}
