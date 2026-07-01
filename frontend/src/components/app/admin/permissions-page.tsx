"use client";

import { listPermissions } from "@/components/app/api/authorization";
import { ResourcePageShell } from "@/components/app/shared/resource-page-shell";
import { permissionsModule } from "./permissions-module";

export function PermissionsPage() {
  return (
    <ResourcePageShell
      title="Permisos"
      description="Acciones disponibles en el sistema (formato módulo:acción)."
      emptyTitle="No hay permisos"
      emptyDescription="No se encontraron permisos en el catálogo."
      access={permissionsModule}
      load={() => listPermissions()}
      columns={[
        { key: "name", label: "Permiso", render: (item) => item.name },
        { key: "module", label: "Módulo", render: (item) => item.module },
      ]}
    />
  );
}
