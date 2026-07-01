import type React from "react";
import { jobTitlesModule } from "@/components/app/admin/job-titles-module";
import { permissionsModule } from "@/components/app/admin/permissions-module";
import { rolesModule } from "@/components/app/admin/roles-module";
import { systemModule } from "@/components/app/admin/system-module";
import { companiesModule } from "@/components/app/companies/companies-module";
import { projectsModule } from "@/components/app/projects/projects-module";
import { usersModule } from "@/components/app/users/users-module";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export type NavModule = ModuleAccess & {
  title: string;
  href: string;
  icon: React.ComponentType;
};

export const companiesNavGroup = {
  parent: companiesModule,
  children: [projectsModule],
} satisfies {
  parent: NavModule;
  children: NavModule[];
};

export const companiesSectionHrefs = [
  companiesModule.href,
  projectsModule.href,
  "/app/projects/",
];

export const appStandaloneNav = [usersModule] satisfies NavModule[];

export const administrationNav = [
  jobTitlesModule,
  rolesModule,
  permissionsModule,
  systemModule,
] satisfies NavModule[];
