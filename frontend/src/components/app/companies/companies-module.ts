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
