"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, KeyRound, Shield, Users } from "lucide-react";
import { jobTitlesModule } from "@/components/app/admin/job-titles-module";
import { permissionsModule } from "@/components/app/admin/permissions-module";
import { rolesModule } from "@/components/app/admin/roles-module";
import { canAccessModule } from "@/components/app/shared/permissions";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { usersModule } from "./users-module";

const SECTIONS = [
  {
    id: "usuarios",
    title: "Usuarios",
    href: "/app/users",
    icon: Users,
    module: usersModule,
    exact: true,
  },
  {
    id: "cargos",
    title: "Cargos",
    href: "/app/users/job-titles",
    icon: Briefcase,
    module: jobTitlesModule,
    exact: false,
  },
  {
    id: "roles",
    title: "Roles",
    href: "/app/users/roles",
    icon: Shield,
    module: rolesModule,
    exact: false,
  },
  {
    id: "permisos",
    title: "Permisos",
    href: "/app/users/permissions",
    icon: KeyRound,
    module: permissionsModule,
    exact: false,
  },
] as const;

function isSectionActive(pathname: string, href: string, exact: boolean) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UsersSectionNav() {
  const pathname = usePathname();
  const { claims } = useAuth();

  const visibleSections = SECTIONS.filter((section) =>
    canAccessModule(claims, section.module),
  );

  if (visibleSections.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Secciones de usuarios"
      className="flex flex-wrap gap-2 border-b border-border/70 pb-3"
    >
      {visibleSections.map((section) => {
        const Icon = section.icon;
        const active = isSectionActive(pathname, section.href, section.exact);

        return (
          <Link
            key={section.id}
            href={section.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {section.title}
          </Link>
        );
      })}
    </nav>
  );
}
