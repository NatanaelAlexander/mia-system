"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  updateProject,
  type ProjectListItem,
} from "@/components/app/api/projects";
import {
  formatProjectStatus,
  formatProjectType,
} from "@/components/app/shared/format";
import {
  canAccessModule,
  hasPermission,
  isInternalUser,
} from "@/components/app/shared/permissions";
import { assetsModule } from "@/components/app/assets/assets-module";
import { ticketsModule } from "@/components/app/tickets/tickets-module";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ProjectEditForm, type EditProjectFormValues } from "./project-form";
import { ProjectSectionCards } from "./project-section-cards";

interface ProjectHubPanelProps {
  project: ProjectListItem;
  companyName: string;
  onUpdated?: (project: ProjectListItem) => void;
  showSectionCards?: boolean;
}

export function ProjectHubPanel({
  project,
  companyName,
  onUpdated,
  showSectionCards = true,
}: ProjectHubPanelProps) {
  const { claims } = useAuth();
  const canEdit =
    isInternalUser(claims) && hasPermission(claims, "projects:update");
  const canAccessTickets = canAccessModule(claims, ticketsModule);
  const canAccessAssets =
    isInternalUser(claims) && canAccessModule(claims, assetsModule);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentProject, setCurrentProject] = React.useState(project);

  React.useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  const handleSubmit = async (values: EditProjectFormValues) => {
    setIsSubmitting(true);

    try {
      const updated = await updateProject(currentProject.id, {
        name: values.name.trim(),
        type: values.type,
        status: values.status,
      });
      setCurrentProject(updated);
      onUpdated?.(updated);
      toast.success("Proyecto actualizado");
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{companyName}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {currentProject.name}
          </h2>
          <Badge variant="secondary">
            {formatProjectStatus(currentProject.status)}
          </Badge>
          <Badge variant="outline">{formatProjectType(currentProject.type)}</Badge>
        </div>
      </div>

      {canEdit ? (
        <ProjectEditForm
          key={currentProject.id}
          companyName={companyName}
          defaultValues={{
            name: currentProject.name,
            type: currentProject.type,
            status: currentProject.status,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ) : (
        <div className="grid gap-4 rounded-xl border border-border/70 p-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground">Empresa</Label>
            <p className="text-sm font-medium">{companyName}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Nombre</Label>
            <p className="text-sm font-medium">{currentProject.name}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Tipo</Label>
            <p className="text-sm font-medium">
              {formatProjectType(currentProject.type)}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Estado</Label>
            <p className="text-sm font-medium">
              {formatProjectStatus(currentProject.status)}
            </p>
          </div>
        </div>
      )}

      {showSectionCards ? (
        <div className="space-y-3 border-t border-border/70 pt-6">
          <div>
            <p className="text-sm font-medium">Secciones del proyecto</p>
            <p className="text-sm text-muted-foreground">
              Revisa tickets o archivos con el contexto de este proyecto.
            </p>
          </div>
          <ProjectSectionCards
            projectId={currentProject.id}
            showTickets={canAccessTickets}
            showAssets={canAccessAssets}
          />
        </div>
      ) : null}
    </div>
  );
}
