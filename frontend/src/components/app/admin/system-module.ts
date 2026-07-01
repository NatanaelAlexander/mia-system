import { Settings2 } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const systemModule = {
  title: "Sistema",
  href: "/app/system",
  icon: Settings2,
  requiredPermission: "system:manage",
  internalOnly: true,
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof Settings2;
};
