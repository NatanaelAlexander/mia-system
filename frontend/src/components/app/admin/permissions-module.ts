import { KeyRound } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const permissionsModule = {
  title: "Permisos",
  href: "/app/permissions",
  icon: KeyRound,
  requiredPermission: "permissions:read",
  internalOnly: true,
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof KeyRound;
};
