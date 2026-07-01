"use client";

import { getProfile } from "@/components/app/api/profile";
import { ResourcePageShell } from "@/components/app/shared/resource-page-shell";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";

export function ProfilePage() {
  const { claims } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";

  return (
    <ResourcePageShell
      title="Perfil"
      description="Datos del usuario autenticado."
      emptyTitle="Perfil no disponible"
      emptyDescription="No se pudo cargar el perfil del usuario autenticado."
      access={{}}
      load={async () => [await getProfile(surface)]}
      columns={[
        {
          key: "name",
          label: "Nombre",
          render: (item) => `${item.firstName} ${item.lastName}`,
        },
        { key: "email", label: "Email", render: (item) => item.email },
        { key: "phone", label: "Teléfono", render: (item) => item.phoneNumber ?? "—" },
        {
          key: "permissionsVersion",
          label: "Perm. v",
          render: (item) => item.permissionsVersion,
        },
      ]}
    />
  );
}
