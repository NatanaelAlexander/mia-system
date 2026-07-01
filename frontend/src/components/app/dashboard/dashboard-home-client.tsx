"use client";

import * as React from "react";
import { listCompanies } from "@/components/app/api/companies";
import { listProjects } from "@/components/app/api/projects";
import { listTickets } from "@/components/app/api/tickets";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHome } from "./dashboard-home";
import { DashboardSkeleton } from "./dashboard-skeleton";

type DashboardStat = { label: string; value: number | string; helper: string };

export function DashboardHomeClient() {
  const { claims, isLoading } = useAuth();
  const [stats, setStats] = React.useState<DashboardStat[]>([]);
  const [isFetching, setIsFetching] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!claims) {
      setStats([
        {
          label: "Sesión",
          value: 0,
          helper: "No hay sesión activa en el cliente.",
        },
      ]);
      setIsFetching(false);
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      setIsFetching(true);
      setLoadError(null);

      const surface = preferredSurface(claims!);
      const tasks: Array<Promise<DashboardStat>> = [];

      if (claims!.permissions.includes("tickets:read")) {
        tasks.push(
          listTickets(surface).then((tickets) => ({
            label: "Tickets",
            value: tickets.length,
            helper: tickets.length === 0 ? "Sin tickets registrados." : "Total visible.",
          })),
        );
      }

      if (claims!.permissions.includes("companies:read")) {
        tasks.push(
          listCompanies(surface).then((companies) => ({
            label: "Empresas",
            value: companies.length,
            helper:
              companies.length === 0 ? "Sin empresas disponibles." : "Total visible.",
          })),
        );
      }

      if (claims!.permissions.includes("projects:read")) {
        tasks.push(
          listProjects(surface).then((projects) => ({
            label: "Proyectos",
            value: projects.length,
            helper:
              projects.length === 0 ? "Sin proyectos disponibles." : "Total visible.",
          })),
        );
      }

      const results = await Promise.allSettled(tasks);
      if (cancelled) {
        return;
      }

      const fulfilled = results
        .filter((result): result is PromiseFulfilledResult<DashboardStat> => {
          return result.status === "fulfilled";
        })
        .map((result) => result.value);

      if (results.some((result) => result.status === "rejected")) {
        setLoadError("Algunos módulos no pudieron cargar. Revisa permisos o conexión.");
      }

      setStats(
        fulfilled.length > 0
          ? fulfilled
          : [
              {
                label: "Módulos",
                value: 0,
                helper: "No hay módulos de datos habilitados para este usuario.",
              },
            ],
      );
      setIsFetching(false);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [claims, isLoading]);

  if (isLoading || isFetching) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardHome
      userName={claims?.firstName}
      surfaces={claims?.surfaces ?? []}
      stats={stats}
      loadError={loadError}
    />
  );
}
