"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, RefreshCcw } from "lucide-react";
import { listUsers, type UserListItem } from "@/components/app/api/users";
import { type DataColumn } from "@/components/app/shared/data-table";
import { formatDate } from "@/components/app/shared/format";
import { HelpHint } from "@/components/app/shared/help-hint";
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
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { UserCreateDialog } from "./user-create-dialog";
import {
  INTERNAL_ROLE_NAMES,
  PORTAL_CLIENT_ROLE,
  type UserAudience,
} from "./user-form";
import { usersModule } from "./users-module";

type LoadState =
  | { status: "loading"; data: UserListItem[] }
  | { status: "success"; data: UserListItem[] }
  | { status: "error"; message: string; data: UserListItem[] };

const AUDIENCE_HELP: Record<UserAudience, string> = {
  internal:
    "Usuarios del equipo interno (admin / super admin). Acceden a la aplicación de operación: empresas, proyectos, tickets y administración.",
  portal:
    "Usuarios cliente del portal. Acceden solo a las empresas vinculadas y a la operación que les corresponda como cliente.",
};

const AUDIENCE_META: Record<
  UserAudience,
  { title: string; description: string; createLabel: string; emptyTitle: string }
> = {
  internal: {
    title: "Internos",
    description: "Equipo con acceso a la aplicación interna.",
    createLabel: "Nuevo usuario interno",
    emptyTitle: "No hay usuarios internos",
  },
  portal: {
    title: "Portal",
    description: "Clientes con acceso al portal.",
    createLabel: "Nuevo usuario portal",
    emptyTitle: "No hay usuarios portal",
  },
};

async function listUsersByAudience(audience: UserAudience) {
  if (audience === "portal") {
    return listUsers({ roleName: PORTAL_CLIENT_ROLE });
  }

  const [admins, superAdmins] = await Promise.all(
    [...INTERNAL_ROLE_NAMES].map((roleName) => listUsers({ roleName })),
  );

  const byId = new Map<string, UserListItem>();
  for (const user of [...admins, ...superAdmins]) {
    byId.set(user.id, user);
  }

  return [...byId.values()].sort((a, b) => {
    const last = a.lastName.localeCompare(b.lastName, "es");
    if (last !== 0) {
      return last;
    }
    return a.firstName.localeCompare(b.firstName, "es");
  });
}

export function UsersPage() {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const canAccess = canAccessModule(claims, usersModule);
  const canCreate = hasPermission(claims, "users:create");

  const [audience, setAudience] = React.useState<UserAudience>("internal");
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
      const data = await listUsersByAudience(audience);
      setState({ status: "success", data });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los usuarios.";
      setState({ status: "error", message, data: [] });
    }
  }, [audience, canAccess, claims]);

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
      {
        key: "email",
        label: "Correo",
        render: (item) => item.email,
      },
      {
        key: "createdAt",
        label: "Fecha creación",
        render: (item) => formatDate(item.createdAt),
      },
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

  const meta = AUDIENCE_META[audience];

  if (!isAuthLoading && !canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cuentas</CardTitle>
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
          <CardTitle>Cuentas</CardTitle>
          <CardDescription>
            Gestiona por separado el equipo interno y los clientes del portal.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <Tabs
            value={audience}
            onValueChange={(value) => {
              if (value === "internal" || value === "portal") {
                setAudience(value);
              }
            }}
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTab value="internal" className="flex-1 gap-1.5 sm:flex-none">
                Internos
                <HelpHint
                  label="Qué son los usuarios internos"
                  text={AUDIENCE_HELP.internal}
                />
              </TabsTab>
              <TabsTab value="portal" className="flex-1 gap-1.5 sm:flex-none">
                Portal
                <HelpHint
                  label="Qué son los usuarios portal"
                  text={AUDIENCE_HELP.portal}
                />
              </TabsTab>
              <TabsIndicator />
            </TabsList>

            <TabsPanel value={audience} className="mt-4 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {meta.description}
                </p>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {canCreate ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus />
                      {meta.createLabel}
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

              {state.status === "loading" || isAuthLoading ? (
                <ListSkeleton columns={columns.length} />
              ) : state.status === "error" ? (
                <ErrorState message={state.message} onRetry={reload} />
              ) : state.data.length === 0 ? (
                <EmptyState
                  title={meta.emptyTitle}
                  description={
                    canCreate
                      ? `Crea el primero con «${meta.createLabel}».`
                      : "Los usuarios aparecerán aquí cuando existan."
                  }
                />
              ) : (
                <DataTable columns={columns} data={state.data} />
              )}
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>

      {canCreate ? (
        <UserCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={reload}
          audience={audience}
        />
      ) : null}
    </>
  );
}
