import { Shield } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const rolesModule = {
  title: "Roles",
  href: "/app/roles",
  icon: Shield,
  requiredPermission: "roles:read",
  internalOnly: true,
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof Shield;
};
