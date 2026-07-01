"use client";

import { listUsers } from "@/components/app/api/users";
import { ResourcePageShell } from "@/components/app/shared/resource-page-shell";
import { usersModule } from "./users-module";

export function UsersPage() {
  return (
    <ResourcePageShell
      title="Usuarios"
      description="Usuarios activos/inactivos administrables por permisos."
      emptyTitle="No hay usuarios"
      emptyDescription="No se encontraron usuarios con los filtros actuales del backend."
      access={usersModule}
      load={() => listUsers()}
      columns={[
        {
          key: "name",
          label: "Nombre",
          render: (item) => `${item.firstName} ${item.lastName}`,
        },
        { key: "email", label: "Email", render: (item) => item.email },
        {
          key: "isActive",
          label: "Estado",
          render: (item) => (item.isActive ? "Activo" : "Inactivo"),
        },
        {
          key: "permVersion",
          label: "Perm. v",
          render: (item) => item.permissionsVersion,
        },
      ]}
    />
  );
}
