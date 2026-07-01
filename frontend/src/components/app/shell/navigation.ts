import type React from "react";
import { assetsModule } from "@/components/app/assets/assets-module";
import { permissionsModule } from "@/components/app/admin/permissions-module";
import { rolesModule } from "@/components/app/admin/roles-module";
import { systemModule } from "@/components/app/admin/system-module";
import { companiesModule } from "@/components/app/companies/companies-module";
import { projectsModule } from "@/components/app/projects/projects-module";
import { ticketsModule } from "@/components/app/tickets/tickets-module";
import { usersModule } from "@/components/app/users/users-module";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export type NavModule = ModuleAccess & {
  title: string;
  href: string;
  icon: React.ComponentType;
};

export const companiesNavGroup = {
  parent: companiesModule,
  children: [ticketsModule, projectsModule, assetsModule],
} satisfies {
  parent: NavModule;
  children: NavModule[];
};

export const companiesSectionHrefs = [
  companiesModule.href,
  ...companiesNavGroup.children.map((item) => item.href),
];

export const appStandaloneNav = [usersModule] satisfies NavModule[];

export const administrationNav = [
  rolesModule,
  permissionsModule,
  systemModule,
] satisfies NavModule[];
