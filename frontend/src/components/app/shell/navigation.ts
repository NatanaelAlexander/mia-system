import type React from "react";
import { systemModule } from "@/components/app/admin/system-module";
import { companiesModule } from "@/components/app/companies/companies-module";
import { usersModule } from "@/components/app/users/users-module";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export type NavModule = ModuleAccess & {
  title: string;
  href: string;
  icon: React.ComponentType;
};

export const appStandaloneNav = [companiesModule] satisfies NavModule[];

export const administrationNav = [
  usersModule,
  systemModule,
] satisfies NavModule[];
