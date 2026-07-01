"use client";

import * as React from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { listProjects, type ProjectListItem } from "@/components/app/api/projects";
import type { ResourceSurface } from "@/components/app/api/types";
import { formatProjectType } from "@/components/app/shared/format";
import { ListSkeleton } from "@/components/app/shared/list-states";
import { ApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CompanyProjectsSectionProps {
  companyId: string;
  surface: ResourceSurface;
}

export function CompanyProjectsSection({
  companyId,
  surface,
}: CompanyProjectsSectionProps) {
  const [projects, setProjects] = React.useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadProjects = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await listProjects(surface, {
        companyId,
        status: surface === "internal" ? "active" : undefined,
      });
      setProjects(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los proyectos.";
      toast.error(message);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, surface]);

  React.useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadProjects();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadProjects]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proyectos activos</CardTitle>
        <CardDescription>
          Proyectos activos vinculados a esta empresa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ListSkeleton columns={3} rows={3} />
        ) : projects.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Esta empresa no tiene proyectos activos.
          </p>
        ) : (
          <div className="divide-y divide-border/70 rounded-xl border border-border/70">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="flex items-center justify-between gap-3 p-3 text-sm transition-colors hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderKanban className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{project.name}</p>
                    <p className="text-muted-foreground">
                      {formatProjectType(project.type)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Activo</Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
