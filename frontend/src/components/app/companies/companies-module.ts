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
  | "documentos";

export type CompanyDocumentsSubTab =
  | "cotizaciones"
  | "contratos"
  | "general";

/** Enlace a la ficha de empresa con pestaña (y subpestaña de Documentos). */
export function companyDetailHref(
  companyId: string,
  tab?: CompanyDetailTab,
  docs?: CompanyDocumentsSubTab,
): string {
  if (!tab || tab === "datos") {
    return `/app/companies/${companyId}`;
  }

  const params = new URLSearchParams();
  params.set("tab", tab);
  if (tab === "documentos" && docs) {
    params.set("docs", docs);
  }

  return `/app/companies/${companyId}?${params.toString()}`;
}
