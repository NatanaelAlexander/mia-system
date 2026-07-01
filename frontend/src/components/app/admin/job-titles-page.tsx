"use client";

import * as React from "react";
import { Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createJobTitle,
  deleteJobTitle,
  listJobTitlesAdmin,
  updateJobTitle,
  type JobTitleListItem,
} from "@/components/app/api/job-titles";
import { type DataColumn } from "@/components/app/shared/data-table";
import { DataTable } from "@/components/app/shared/data-table";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import {
  canAccessModule,
  hasPermission,
} from "@/components/app/shared/permissions";
import { ConfirmDialog } from "@/components/app/shared/confirm-dialog";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jobTitlesModule } from "./job-titles-module";

type LoadState =
  | { status: "loading"; data: JobTitleListItem[] }
  | { status: "success"; data: JobTitleListItem[] }
  | { status: "error"; message: string; data: JobTitleListItem[] };

export function JobTitlesPage() {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const canAccess = canAccessModule(claims, jobTitlesModule);
  const canCreate = hasPermission(claims, "job_titles:create");
  const canUpdate = hasPermission(claims, "job_titles:update");
  const canDelete = hasPermission(claims, "job_titles:delete");

  const [state, setState] = React.useState<LoadState>({
    status: "loading",
    data: [],
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<JobTitleListItem | null>(null);
  const [name, setName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<JobTitleListItem | null>(
    null,
  );

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setState({ status: "success", data: [] });
      return;
    }

    setState((current) => ({ status: "loading", data: current.data }));

    try {
      const data = await listJobTitlesAdmin();
      setState({ status: "success", data });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los cargos.";
      setState({ status: "error", message, data: [] });
    }
  }, [canAccess, claims]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void reload();
    }
  }, [isAuthLoading, reload]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (item: JobTitleListItem) => {
    setEditing(item);
    setName(item.name);
    setDialogOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("El nombre del cargo es obligatorio.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editing) {
        await updateJobTitle(editing.id, trimmed);
        toast.success("Cargo actualizado");
      } else {
        await createJobTitle(trimmed);
        toast.success("Cargo creado");
      }

      setDialogOpen(false);
      await reload();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar el cargo.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteJobTitle(deleteTarget.id);
      toast.success("Cargo eliminado");
      setDeleteTarget(null);
      await reload();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo eliminar el cargo.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = React.useMemo<DataColumn<JobTitleListItem>[]>(
    () => [
      {
        key: "name",
        label: "Cargo",
        width: "wide",
        render: (item) => <span className="font-medium">{item.name}</span>,
      },
      {
        key: "userCount",
        label: "Usuarios",
        width: "auto",
        render: (item) => item.userCount,
      },
      {
        key: "actions",
        label: "Acciones",
        width: "auto",
        headerClassName: "text-right",
        className: "text-right",
        render: (item) => (
          <div className="flex justify-end gap-1">
            {canUpdate ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => openEdit(item)}
              >
                <Pencil />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteTarget(item)}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canUpdate],
  );

  if (!isAuthLoading && !canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargos</CardTitle>
          <CardDescription>
            Catálogo de cargos internos (programador, QA, PM, etc.).
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
              <CardTitle>Cargos</CardTitle>
              <CardDescription>
                Administra las etiquetas internas del equipo. No cambian permisos,
                solo cómo se identifica a cada persona.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {canCreate ? (
                <Button type="button" size="sm" onClick={openCreate}>
                  <Plus />
                  Nuevo cargo
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void reload()}
                disabled={state.status === "loading"}
              >
                <RefreshCcw />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {state.status === "loading" || isAuthLoading ? (
            <ListSkeleton columns={columns.length} />
          ) : state.status === "error" ? (
            <ErrorState message={state.message} onRetry={reload} />
          ) : state.data.length === 0 ? (
            <EmptyState
              title="No hay cargos"
              description="Crea el primero, por ejemplo Programador o Diseñador UI."
            />
          ) : (
            <DataTable columns={columns} data={state.data} />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cargo" : "Nuevo cargo"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Actualiza el nombre visible del cargo en el sistema."
                : "Ej: Programador backend, QA, Project Manager."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-2">
              <Label htmlFor="job-title-name">Nombre</Label>
              <Input
                id="job-title-name"
                value={name}
                disabled={isSubmitting}
                onChange={(event) => setName(event.target.value)}
                placeholder="Programador backend"
                maxLength={100}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "Guardando..." : editing ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Eliminar cargo"
        description={
          deleteTarget
            ? deleteTarget.userCount > 0
              ? `¿Eliminar "${deleteTarget.name}"? Se quitará de ${deleteTarget.userCount} usuario(s) que lo tengan asignado.`
              : `¿Eliminar "${deleteTarget.name}"?`
            : ""
        }
        confirmLabel="Eliminar"
        isConfirming={isSubmitting}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
