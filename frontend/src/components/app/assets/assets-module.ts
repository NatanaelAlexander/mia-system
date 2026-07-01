import { Files } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const assetsModule = {
  title: "Archivos",
  href: "/app/assets",
  icon: Files,
  requiredPermission: "assets:read",
  internalOnly: true,
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof Files;
};
