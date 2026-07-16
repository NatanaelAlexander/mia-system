"use client";

import * as React from "react";
import Link from "next/link";
import { Filter, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import {
  listProjects,
  type ProjectListItem,
  type ProjectStatus,
} from "@/components/app/api/projects";
import type { ResourceSurface } from "@/components/app/api/types";
import {
  formatProjectStatus,
  formatProjectType,
} from "@/components/app/shared/format";
import { HelpHint } from "@/components/app/shared/help-hint";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompanyProjectsSectionProps {
  companyId: string;
  surface: ResourceSurface;
}

type StatusFilter = "all" | ProjectStatus;

const statusFilterItems = [
  { label: "Activos", value: "active" as const },
  { label: "Inactivos", value: "inactive" as const },
  { label: "Completados", value: "completed" as const },
  { label: "Todos", value: "all" as const },
];

export function CompanyProjectsSection({
  companyId,
  surface,
}: CompanyProjectsSectionProps) {
  const [projects, setProjects] = React.useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");

  const loadProjects = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await listProjects(surface, {
        companyId,
        status:
          surface === "internal" && statusFilter !== "all"
            ? statusFilter
            : undefined,
      });

      const visible =
        surface === "portal" && statusFilter !== "all"
          ? data.filter((project) => project.status === statusFilter)
          : data;

      setProjects(visible);
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
  }, [companyId, statusFilter, surface]);

  React.useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadProjects();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadProjects]);

  const emptyMessage =
    statusFilter === "active"
      ? "Esta empresa no tiene proyectos activos."
      : statusFilter === "inactive"
        ? "Esta empresa no tiene proyectos inactivos."
        : statusFilter === "completed"
          ? "Esta empresa no tiene proyectos completados."
          : "Esta empresa no tiene proyectos.";

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="size-4 text-primary" />
            Proyectos
            <HelpHint
              label="Qué son los proyectos"
              text="Proyectos asociados a esta empresa. Puedes filtrar por activos, inactivos o completados."
            />
          </CardTitle>
          <CardDescription>
            Proyectos vinculados a esta empresa. Filtra por estado para ver
            activos o desactivados.
          </CardDescription>
        </div>

        <div className="w-full space-y-2 sm:w-48">
          <Label
            htmlFor="company-project-status-filter"
            className="inline-flex items-center gap-1.5"
          >
            <Filter className="size-3.5 text-muted-foreground" />
            Estado
            <HelpHint
              label="Filtro de estado de proyectos"
              text="Activos: en operación. Inactivos: desactivados. Completados: finalizados. Todos: sin filtrar."
            />
          </Label>
          <Select
            items={statusFilterItems}
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter((value as StatusFilter | null) ?? "active")
            }
          >
            <SelectTrigger id="company-project-status-filter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusFilterItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ListSkeleton columns={3} rows={3} />
        ) : projects.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            {emptyMessage}
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
                <Badge
                  variant={
                    project.status === "active" ? "secondary" : "outline"
                  }
                >
                  {formatProjectStatus(project.status)}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
