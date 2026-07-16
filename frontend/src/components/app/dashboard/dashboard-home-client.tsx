"use client";

import * as React from "react";
import { listCompanies } from "@/components/app/api/companies";
import { listTickets } from "@/components/app/api/tickets";
import { hasPermission } from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import {
  DashboardHome,
  type CompanyStats,
  type TicketStats,
} from "./dashboard-home";
import { DashboardSkeleton } from "./dashboard-skeleton";

export function DashboardHomeClient() {
  const { claims, isLoading } = useAuth();
  const [companies, setCompanies] = React.useState<CompanyStats | null>(null);
  const [tickets, setTickets] = React.useState<TicketStats | null>(null);
  const [isFetching, setIsFetching] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!claims) {
      setCompanies(null);
      setTickets(null);
      setIsFetching(false);
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      setIsFetching(true);
      setLoadError(null);

      const surface = preferredSurface(claims!);
      const canReadCompanies = hasPermission(claims, "companies:read");
      const canReadTickets = hasPermission(claims, "tickets:read");

      const [companyResult, ticketResult] = await Promise.allSettled([
        canReadCompanies
          ? listCompanies(surface)
          : Promise.resolve(null),
        canReadTickets
          ? listTickets(surface, { lifecycle: "all" })
          : Promise.resolve(null),
      ]);

      if (cancelled) {
        return;
      }

      let hadError = false;

      if (companyResult.status === "fulfilled" && companyResult.value) {
        const rows = companyResult.value;
        const active = rows.filter((c) => c.status === "active").length;
        setCompanies({
          total: rows.length,
          active,
          inactive: rows.length - active,
        });
      } else if (companyResult.status === "rejected") {
        hadError = true;
        setCompanies(null);
      } else {
        setCompanies(null);
      }

      if (ticketResult.status === "fulfilled" && ticketResult.value) {
        const rows = ticketResult.value;
        const closed = rows.filter((t) => t.isClosed).length;
        setTickets({
          total: rows.length,
          active: rows.length - closed,
          closed,
        });
      } else if (ticketResult.status === "rejected") {
        hadError = true;
        setTickets(null);
      } else {
        setTickets(null);
      }

      if (hadError) {
        setLoadError(
          "Algunos módulos no pudieron cargar. Revisa permisos o conexión.",
        );
      }

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
      surfaces={claims?.surfaces ?? []}
      companies={companies}
      tickets={tickets}
      canViewTicketsChart={hasPermission(claims, "tickets:read")}
      canViewActivity={hasPermission(claims, "audit_logs:read")}
      loadError={loadError}
    />
  );
}
