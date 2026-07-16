import { Building2 } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const companiesModule = {
  title: "Empresas",
  href: "/app/companies",
  icon: Building2,
  requiredPermission: "companies:read",
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof Building2;
};

export type CompanyDetailTab =
  | "datos"
  | "representantes"
  | "usuarios"
  | "proyectos"
  | "cotizaciones";

/** Enlace a la ficha de empresa con una pestaña concreta (p. ej. proyectos). */
export function companyDetailHref(
  companyId: string,
  tab?: CompanyDetailTab,
): string {
  if (!tab || tab === "datos") {
    return `/app/companies/${companyId}`;
  }

  return `/app/companies/${companyId}?tab=${tab}`;
}
