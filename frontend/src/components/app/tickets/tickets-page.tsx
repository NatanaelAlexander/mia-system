"use client";

import { listTickets } from "@/components/app/api/tickets";
import { formatDate } from "@/components/app/shared/format";
import { ResourcePageShell } from "@/components/app/shared/resource-page-shell";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { ticketsModule } from "./tickets-module";

export function TicketsPage() {
  const { claims } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";

  return (
    <ResourcePageShell
      title="Tickets"
      description="Solicitudes, estados, prioridades y seguimiento."
      emptyTitle="No hay tickets"
      emptyDescription="Cuando se creen tickets aparecerán aquí. Un resultado vacío no es carga pendiente."
      access={ticketsModule}
      load={() => listTickets(surface)}
      columns={[
        { key: "title", label: "Título", render: (item) => item.title },
        { key: "status", label: "Estado", render: (item) => item.statusName },
        { key: "priority", label: "Prioridad", render: (item) => item.priorityName },
        {
          key: "category",
          label: "Categoría",
          render: (item) => item.categoryName ?? "Sin categoría",
        },
        {
          key: "createdAt",
          label: "Creado",
          render: (item) => formatDate(item.createdAt),
        },
      ]}
    />
  );
}
