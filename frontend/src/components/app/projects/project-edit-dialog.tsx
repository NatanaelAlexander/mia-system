"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  updateProject,
  type ProjectListItem,
} from "@/components/app/api/projects";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectEditForm, type EditProjectFormValues } from "./project-form";

interface ProjectEditDialogProps {
  project: ProjectListItem | null;
  companyName: string;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function ProjectEditDialog({
  project,
  companyName,
  onOpenChange,
  onUpdated,
}: ProjectEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (values: EditProjectFormValues) => {
    if (!project) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updateProject(project.id, {
        name: values.name.trim(),
        type: values.type,
        status: values.status,
      });
      toast.success("Proyecto actualizado");
      onOpenChange(false);
      onUpdated?.();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el proyecto.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={project !== null}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar proyecto</DialogTitle>
          <DialogDescription>
            Actualiza el nombre, tipo y estado del proyecto.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        {project ? (
          <ProjectEditForm
            key={project.id}
            companyName={companyName}
            defaultValues={{
              name: project.name,
              type: project.type,
              status: project.status,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
