"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, RefreshCcw } from "lucide-react";
import { listCompanies } from "@/components/app/api/companies";
import {
  listProjects,
  type ProjectListItem,
  type ProjectStatus,
} from "@/components/app/api/projects";
import { DataTable, type DataColumn } from "@/components/app/shared/data-table";
import {
  formatDate,
  formatProjectStatus,
  formatProjectType,
} from "@/components/app/shared/format";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import {
  canAccessModule,
  hasPermission,
  isInternalUser,
} from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ProjectCreateDialog } from "./project-create-dialog";
import { projectsModule } from "./projects-module";

type LoadState =
  | { status: "loading"; data: ProjectListItem[] }
  | { status: "success"; data: ProjectListItem[] }
  | { status: "error"; message: string; data: ProjectListItem[] };

type StatusFilter = "all" | ProjectStatus;

const statusFilterItems = [
  { label: "Todos", value: "all" as const },
  { label: "Activos", value: "active" as const },
  { label: "Inactivos", value: "inactive" as const },
  { label: "Completados", value: "completed" as const },
];

export function ProjectsPage() {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const isInternal = isInternalUser(claims);
  const canAccess = canAccessModule(claims, projectsModule);
  const canCreate =
    isInternalUser(claims) && hasPermission(claims, "projects:create");

  const [state, setState] = React.useState<LoadState>({
    status: "loading",
    data: [],
  });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");
  const [companyNames, setCompanyNames] = React.useState<Record<string, string>>(
    {},
  );

  const apiFilters = React.useMemo(
    () => ({
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [statusFilter],
  );

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setState({ status: "success", data: [] });
      return;
    }

    setState((current) => ({ status: "loading", data: current.data }));

    try {
      const [projects, companies] = await Promise.all([
        listProjects(surface, isInternal ? apiFilters : {}),
        listCompanies(surface, isInternal ? {} : {}),
      ]);

      setCompanyNames(
        Object.fromEntries(companies.map((company) => [company.id, company.name])),
      );

      setState({ status: "success", data: projects });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los proyectos.";
      setState({ status: "error", message, data: [] });
    }
  }, [apiFilters, canAccess, claims, isInternal, surface]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void reload();
    }
  }, [isAuthLoading, reload]);

  const columns = React.useMemo<DataColumn<ProjectListItem>[]>(() => {
    const base: DataColumn<ProjectListItem>[] = [
      {
        key: "name",
        label: "Proyecto",
        render: (item) => (
          <Link
            href={`/app/projects/${item.id}`}
            className="font-medium text-primary hover:underline"
          >
            {item.name}
          </Link>
        ),
      },
    ];

    if (isInternal) {
      base.push({
        key: "company",
        label: "Empresa",
        render: (item) => companyNames[item.companyId] ?? "—",
      });
    }

    base.push(
      {
        key: "type",
        label: "Tipo",
        render: (item) => formatProjectType(item.type),
      },
      {
        key: "status",
        label: "Estado",
        render: (item) => (
          <Badge variant={item.status === "active" ? "secondary" : "outline"}>
            {formatProjectStatus(item.status)}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        label: "Creado",
        render: (item) => formatDate(item.createdAt),
      },
    );

    return base;
  }, [companyNames, isInternal]);

  if (!isAuthLoading && !canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proyectos</CardTitle>
          <CardDescription>
            Proyectos activos vinculados a empresas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorState
            message="Tu usuario no tiene permiso para ver este módulo."
            onRetry={reload}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Proyectos</CardTitle>
              <CardDescription>
                {isInternal
                  ? "Gestiona proyectos vinculados a empresas."
                  : "Proyectos activos de tus empresas."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {claims?.surfaces.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
              {canCreate ? (
                <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus />
                  Nuevo proyecto
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reload}
                disabled={state.status === "loading"}
              >
                <RefreshCcw />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {isInternal ? (
            <div className="max-w-xs space-y-2">
              <Label htmlFor="project-status-filter">Estado</Label>
              <Select
                items={statusFilterItems}
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(
                    typeof value === "string" ? (value as StatusFilter) : "active",
                  )
                }
              >
                <SelectTrigger id="project-status-filter">
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
          ) : null}

          {state.status === "loading" || isAuthLoading ? (
            <ListSkeleton columns={columns.length} />
          ) : state.status === "error" ? (
            <ErrorState message={state.message} onRetry={reload} />
          ) : state.data.length === 0 ? (
            <EmptyState
              title="No hay proyectos"
              description={
                canCreate
                  ? "Crea el primer proyecto para empezar a trabajar con tickets y archivos."
                  : "Los proyectos aparecerán aquí cuando existan o estén vinculados a tu empresa."
              }
            />
          ) : (
            <DataTable columns={columns} data={state.data} />
          )}
        </CardContent>
      </Card>

      {canCreate ? (
        <ProjectCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={reload}
        />
      ) : null}
    </>
  );
}
