"use client";

import * as React from "react";
import Link from "next/link";
import { Edit2, Filter, FolderKanban, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import {
  listProjects,
  updateProject,
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
import {
  hasPermission,
  isInternalUser,
  isSuperAdmin,
} from "@/components/app/shared/permissions";
import { ConfirmDialog } from "@/components/app/shared/confirm-dialog";
import { ProjectCreateDialog } from "@/components/app/projects/project-create-dialog";
import {
  ProjectEditForm,
  type EditProjectFormValues,
} from "@/components/app/projects/project-form";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  companyName: string;
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
  companyName,
  surface,
}: CompanyProjectsSectionProps) {
  const { claims } = useAuth();
  const canCreate =
    surface === "internal" &&
    isInternalUser(claims) &&
    isSuperAdmin(claims) &&
    hasPermission(claims, "projects:create");
  const canEdit =
    surface === "internal" &&
    isInternalUser(claims) &&
    hasPermission(claims, "projects:update");

  const [projects, setProjects] = React.useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ProjectListItem | null>(
    null,
  );
  const [statusTarget, setStatusTarget] = React.useState<ProjectListItem | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const handleEditSubmit = async (values: EditProjectFormValues) => {
    if (!editTarget) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProject(editTarget.id, {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        type: values.type,
        status: values.status,
      });
      toast.success("Proyecto actualizado");
      setEditTarget(null);
      await loadProjects();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el proyecto.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) {
      return;
    }

    const nextStatus: ProjectStatus =
      statusTarget.status === "active" ? "inactive" : "active";
    const successMessage =
      nextStatus === "active"
        ? "Proyecto activado correctamente"
        : "Proyecto desactivado correctamente";

    setIsSubmitting(true);

    try {
      await updateProject(statusTarget.id, { status: nextStatus });
      toast.success(successMessage);
      setStatusTarget(null);
      await loadProjects();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cambiar el estado del proyecto.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const emptyMessage =
    statusFilter === "active"
      ? "Esta empresa no tiene proyectos activos."
      : statusFilter === "inactive"
        ? "Esta empresa no tiene proyectos inactivos."
        : statusFilter === "completed"
          ? "Esta empresa no tiene proyectos completados."
          : "Esta empresa no tiene proyectos.";

  const statusConfirmIsActivate = statusTarget?.status !== "active";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div>
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

              <div className="flex flex-wrap items-center gap-2">
                <Label
                  htmlFor="company-project-status-filter"
                  className="inline-flex shrink-0 items-center gap-1.5"
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
                  <SelectTrigger
                    id="company-project-status-filter"
                    className="w-44"
                  >
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
            </div>

            {canCreate ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateOpen(true)}
              >
                <Plus />
                Nuevo proyecto
              </Button>
            ) : null}
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
                <div
                  key={project.id}
                  className="flex flex-col gap-3 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FolderKanban className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/app/projects/${project.id}`}
                        className="truncate font-medium transition-colors hover:text-primary"
                      >
                        {project.name}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">
                          {formatProjectType(project.type)}
                        </span>
                        <Badge
                          variant={
                            project.status === "active"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {formatProjectStatus(project.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {canEdit ? (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTarget(project)}
                        disabled={isSubmitting}
                      >
                        <Edit2 />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusTarget(project)}
                        disabled={isSubmitting}
                      >
                        <Power />
                        {project.status === "active"
                          ? "Desactivar"
                          : "Activar"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canCreate ? (
        <ProjectCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={loadProjects}
          defaultCompanyId={companyId}
        />
      ) : null}

      {canEdit ? (
        <Dialog
          open={editTarget !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditTarget(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar proyecto</DialogTitle>
            </DialogHeader>
            {editTarget ? (
              <ProjectEditForm
                key={editTarget.id}
                companyName={companyName}
                defaultValues={{
                  name: editTarget.name,
                  description: editTarget.description ?? "",
                  type: editTarget.type,
                  status: editTarget.status,
                }}
                onSubmit={handleEditSubmit}
                isSubmitting={isSubmitting}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}

      {canEdit ? (
        <ConfirmDialog
          open={statusTarget !== null}
          onOpenChange={(open) => {
            if (!open) {
              setStatusTarget(null);
            }
          }}
          title={
            statusConfirmIsActivate
              ? "Activar proyecto"
              : "Desactivar proyecto"
          }
          description={
            statusTarget
              ? statusConfirmIsActivate
                ? `¿Activar el proyecto "${statusTarget.name}"? Volverá a estar disponible para operar.`
                : `¿Desactivar el proyecto "${statusTarget.name}"? No se eliminará el registro; solo dejará de estar activo.`
              : ""
          }
          confirmLabel={statusConfirmIsActivate ? "Activar" : "Desactivar"}
          confirmVariant={
            statusConfirmIsActivate ? "default" : "destructive"
          }
          onConfirm={handleToggleStatus}
          isConfirming={isSubmitting}
        />
      ) : null}
    </>
  );
}
