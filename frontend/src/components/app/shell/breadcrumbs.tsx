"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Etiquetas legibles para cada segmento estático de ruta. */
const SEGMENT_LABELS: Record<string, string> = {
  app: "Dashboard",
  companies: "Empresas",
  users: "Usuarios",
  "job-titles": "Cargos",
  roles: "Roles",
  permissions: "Permisos",
  system: "Sistema",
  projects: "Proyectos",
  tickets: "Tickets",
  assets: "Archivos",
  profile: "Perfil",
  help: "Ayuda",
};

type Crumb = {
  label: string;
  href: string;
  isLast: boolean;
};

function labelForSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment) || /^\d+$/.test(segment)) {
    return "Detalle";
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();

  const crumbs = React.useMemo<Crumb[]>(() => {
    const segments = pathname.split("/").filter(Boolean);
    const startIndex = segments[0] === "app" ? 1 : 0;

    const items: Crumb[] = [
      { label: "Dashboard", href: "/app", isLast: segments.length <= 1 },
    ];

    let hrefAcc = "/app";
    for (let i = startIndex; i < segments.length; i += 1) {
      hrefAcc += `/${segments[i]}`;
      items.push({
        label: labelForSegment(segments[i]),
        href: hrefAcc,
        isLast: i === segments.length - 1,
      });
    }

    return items;
  }, [pathname]);

  const mobileCrumbs = React.useMemo(() => {
    if (crumbs.length <= 2) {
      return crumbs;
    }

    return [crumbs[0], crumbs[crumbs.length - 1]];
  }, [crumbs]);

  return (
    <nav aria-label="Ruta de navegación" className="min-w-0 flex-1 overflow-hidden">
      <ol className="flex items-center gap-1 text-sm md:hidden">
        {mobileCrumbs.map((crumb, index) => (
          <li key={`m-${crumb.href}`} className="flex min-w-0 items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
            ) : null}
            {crumb.isLast || index === mobileCrumbs.length - 1 ? (
              <span className="truncate font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>

      <ol className="hidden items-center gap-1 text-sm md:flex">
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1">
            {crumb.isLast ? (
              <span className="truncate font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <>
                <Link
                  href={crumb.href}
                  className={cn(
                    "truncate text-muted-foreground transition-colors hover:text-foreground",
                  )}
                >
                  {crumb.label}
                </Link>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
