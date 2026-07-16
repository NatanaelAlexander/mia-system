"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlignLeft,
  Building2,
  CalendarDays,
  FolderKanban,
  Files,
  Layers,
  SquarePen,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateProject,
  type ProjectListItem,
} from "@/components/app/api/projects";
import {
  formatDate,
  formatProjectStatus,
  formatProjectType,
} from "@/components/app/shared/format";
import {
  canAccessModule,
  hasPermission,
  isInternalUser,
} from "@/components/app/shared/permissions";
import { assetsModule } from "@/components/app/assets/assets-module";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ProjectEditForm, type EditProjectFormValues } from "./project-form";

interface ProjectHubPanelProps {
  project: ProjectListItem;
  companyName: string;
  onUpdated?: (project: ProjectListItem) => void;
}

function InfoField({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5",
        className,
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium wrap-break-word">{value}</div>
      </div>
    </div>
  );
}

export function ProjectHubPanel({
  project,
  companyName,
  onUpdated,
}: ProjectHubPanelProps) {
  const { claims } = useAuth();
  const canEdit =
    isInternalUser(claims) && hasPermission(claims, "projects:update");
  const canAccessAssets =
    isInternalUser(claims) && canAccessModule(claims, assetsModule);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [currentProject, setCurrentProject] = React.useState(project);

  React.useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  const handleSubmit = async (values: EditProjectFormValues) => {
    setIsSubmitting(true);

    try {
      const updated = await updateProject(currentProject.id, {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        type: values.type,
        status: values.status,
      });
      setCurrentProject(updated);
      onUpdated?.(updated);
      setEditOpen(false);
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
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm text-muted-foreground">{companyName}</p>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{currentProject.name}</CardTitle>
            <Badge variant="secondary">
              {formatProjectStatus(currentProject.status)}
            </Badge>
            <Badge variant="outline">
              {formatProjectType(currentProject.type)}
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canAccessAssets ? (
            <Link
              href={`/app/projects/${currentProject.id}/assets`}
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "gap-2 font-semibold shadow-sm",
              )}
            >
              <Files className="size-4" />
              Archivos
            </Link>
          ) : null}

          {canEdit ? (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger
                render={<Button type="button" size="sm" variant="outline" />}
              >
                <SquarePen />
                Editar
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Editar proyecto</DialogTitle>
                </DialogHeader>
                <ProjectEditForm
                  key={currentProject.id}
                  companyName={companyName}
                  defaultValues={{
                    name: currentProject.name,
                    description: currentProject.description ?? "",
                    type: currentProject.type,
                    status: currentProject.status,
                  }}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoField icon={Building2} label="Empresa" value={companyName} />
          <InfoField
            icon={FolderKanban}
            label="Nombre"
            value={currentProject.name}
          />
          <InfoField
            icon={Tag}
            label="Tipo"
            value={formatProjectType(currentProject.type)}
          />
          <InfoField
            icon={Layers}
            label="Estado"
            value={formatProjectStatus(currentProject.status)}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <InfoField
            icon={AlignLeft}
            label="Descripción"
            value={
              currentProject.description?.trim()
                ? currentProject.description
                : "Sin descripción"
            }
          />
          <InfoField
            icon={CalendarDays}
            label="Creado"
            value={formatDate(currentProject.createdAt)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
