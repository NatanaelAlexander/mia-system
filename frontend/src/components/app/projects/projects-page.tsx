"use client";

import { listProjects } from "@/components/app/api/projects";
import { formatDate } from "@/components/app/shared/format";
import { ResourcePageShell } from "@/components/app/shared/resource-page-shell";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { projectsModule } from "./projects-module";

export function ProjectsPage() {
  const { claims } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";

  return (
    <ResourcePageShell
      title="Proyectos"
      description="Proyectos activos vinculados a empresas."
      emptyTitle="No hay proyectos"
      emptyDescription="Los proyectos aparecerán aquí cuando existan o estén vinculados al usuario."
      access={projectsModule}
      load={() => listProjects(surface)}
      columns={[
        { key: "name", label: "Proyecto", render: (item) => item.name },
        { key: "type", label: "Tipo", render: (item) => item.type },
        { key: "status", label: "Estado", render: (item) => item.status },
        {
          key: "createdAt",
          label: "Creado",
          render: (item) => formatDate(item.createdAt),
        },
      ]}
    />
  );
}
