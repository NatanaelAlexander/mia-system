"use client";

import { listCompanies } from "@/components/app/api/companies";
import { ResourcePageShell } from "@/components/app/shared/resource-page-shell";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { companiesModule } from "./companies-module";

export function CompaniesPage() {
  const { claims } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";

  return (
    <ResourcePageShell
      title="Empresas"
      description="Empresas activas según tu superficie de acceso."
      emptyTitle="No hay empresas"
      emptyDescription="Aún no hay empresas disponibles para este usuario o superficie."
      access={companiesModule}
      load={() => listCompanies(surface)}
      columns={[
        { key: "name", label: "Empresa", render: (item) => item.name },
        { key: "taxId", label: "RUT", render: (item) => item.taxId },
        { key: "status", label: "Estado", render: (item) => item.status },
        { key: "email", label: "Email", render: (item) => item.email ?? "—" },
      ]}
    />
  );
}
