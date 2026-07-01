import type React from "react";
import { assetsModule } from "@/components/app/assets/assets-module";
import { companiesModule } from "@/components/app/companies/companies-module";
import { projectsModule } from "@/components/app/projects/projects-module";
import { ticketsModule } from "@/components/app/tickets/tickets-module";
import { usersModule } from "@/components/app/users/users-module";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const appModuleNav = [
  ticketsModule,
  companiesModule,
  projectsModule,
  assetsModule,
  usersModule,
] satisfies Array<
  ModuleAccess & {
    title: string;
    href: string;
    icon: React.ComponentType;
  }
>;
