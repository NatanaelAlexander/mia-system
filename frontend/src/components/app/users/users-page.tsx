"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, RefreshCcw } from "lucide-react";
import { listUsers, type UserListItem } from "@/components/app/api/users";
import { type DataColumn } from "@/components/app/shared/data-table";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import {
  canAccessModule,
  hasPermission,
} from "@/components/app/shared/permissions";
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
import { DataTable } from "@/components/app/shared/data-table";
import { UserCreateDialog } from "./user-create-dialog";
import { usersModule } from "./users-module";

type LoadState =
  | { status: "loading"; data: UserListItem[] }
  | { status: "success"; data: UserListItem[] }
  | { status: "error"; message: string; data: UserListItem[] };

export function UsersPage() {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const canAccess = canAccessModule(claims, usersModule);
  const canCreate = hasPermission(claims, "users:create");

  const [state, setState] = React.useState<LoadState>({
    status: "loading",
    data: [],
  });
  const [createOpen, setCreateOpen] = React.useState(false);

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setState({ status: "success", data: [] });
      return;
    }

    setState((current) => ({ status: "loading", data: current.data }));

    try {
      const data = await listUsers();
      setState({ status: "success", data });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los usuarios.";
      setState({ status: "error", message, data: [] });
    }
  }, [canAccess, claims]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void reload();
    }
  }, [isAuthLoading, reload]);

  const columns = React.useMemo<DataColumn<UserListItem>[]>(
    () => [
      {
        key: "name",
        label: "Nombre",
        width: "wide",
        render: (item) => (
          <Link
            href={`/app/users/${item.id}`}
            className="font-medium text-primary hover:underline"
          >
            {item.firstName} {item.lastName}
          </Link>
        ),
      },
      { key: "email", label: "Email", render: (item) => item.email },
      {
        key: "isActive",
        label: "Estado",
        width: "auto",
        render: (item) => (
          <Badge variant={item.isActive ? "secondary" : "outline"}>
            {item.isActive ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
    ],
    [],
  );

  if (!isAuthLoading && !canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            Usuarios activos/inactivos administrables por permisos.
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
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>
                Crea usuarios internos o clientes portal. Asigna roles y cargos
                del equipo.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {canCreate ? (
                <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus />
                  Nuevo usuario
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
              title="No hay usuarios"
              description="Crea el primer usuario o revisa los filtros del backend."
            />
          ) : (
            <DataTable columns={columns} data={state.data} />
          )}
        </CardContent>
      </Card>

      {canCreate ? (
        <UserCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={reload}
        />
      ) : null}
    </>
  );
}
