import { FolderKanban } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const projectsModule = {
  title: "Proyectos",
  href: "/app/projects",
  icon: FolderKanban,
  requiredPermission: "projects:read",
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof FolderKanban;
};
