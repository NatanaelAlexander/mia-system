import { Briefcase } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const jobTitlesModule = {
  title: "Cargos",
  href: "/app/job-titles",
  icon: Briefcase,
  requiredPermission: "job_titles:read",
  internalOnly: true,
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof Briefcase;
};
