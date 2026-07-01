import { Users } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const usersModule = {
  title: "Usuarios",
  href: "/app/users",
  icon: Users,
  requiredPermission: "users:read",
  internalOnly: true,
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof Users;
};
