"use client";

import { listRoleCatalog } from "@/components/app/api/users";
import { formatRole } from "@/components/app/shared/format";
import { ResourcePageShell } from "@/components/app/shared/resource-page-shell";
import { rolesModule } from "./roles-module";

export function RolesPage() {
  return (
    <ResourcePageShell
      title="Roles"
      description="Catálogo de roles de autorización del sistema."
      emptyTitle="No hay roles"
      emptyDescription="No se encontraron roles en el catálogo."
      access={rolesModule}
      load={() => listRoleCatalog()}
      columns={[
        {
          key: "name",
          label: "Rol",
          render: (item) => formatRole(item.name),
        },
        {
          key: "id",
          label: "ID",
          render: (item) => item.id,
        },
      ]}
    />
  );
}
