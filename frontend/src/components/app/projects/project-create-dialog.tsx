"use client";

import * as React from "react";
import { toast } from "sonner";
import { listCompanies } from "@/components/app/api/companies";
import { createProject } from "@/components/app/api/projects";
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
import { ProjectForm, type ProjectFormValues } from "./project-form";

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: ProjectCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [companies, setCompanies] = React.useState<
    Awaited<ReturnType<typeof listCompanies>>
  >([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadCompanies() {
      setIsLoadingCompanies(true);

      try {
        const data = await listCompanies("internal", { status: "active" });
        if (!cancelled) {
          setCompanies(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError
              ? error.message
              : "No se pudieron cargar las empresas.";
          setErrorMessage(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCompanies(false);
        }
      }
    }

    void loadCompanies();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createProject({
        companyId: values.companyId,
        name: values.name.trim(),
        type: values.type,
      });
      toast.success("Proyecto creado correctamente");
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el proyecto.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
          <DialogDescription>
            Crea un proyecto vinculado a una empresa para tickets y archivos.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        {isLoadingCompanies ? (
          <p className="text-sm text-muted-foreground">Cargando empresas...</p>
        ) : companies.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            No hay empresas activas disponibles. Crea una empresa antes de
            registrar un proyecto.
          </p>
        ) : (
          <ProjectForm
            key={open ? "create-open" : "create-closed"}
            companies={companies}
            onSubmit={handleSubmit}
            submitLabel="Crear proyecto"
            isSubmitting={isSubmitting}
          />
        )}

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
