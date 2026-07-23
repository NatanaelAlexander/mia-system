"use client";

import * as React from "react";
import { Plus, RefreshCcw } from "lucide-react";
import { listTickets } from "@/components/app/api/tickets";
import type { ResourceSurface } from "@/components/app/api/types";
import { ErrorState } from "@/components/app/shared/list-states";
import { canAccessModule, hasPermission, isSuperAdmin } from "@/components/app/shared/permissions";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketCreateDialog } from "../tickets/ticket-create-dialog";
import { TicketsKanbanBoard } from "../tickets/tickets-kanban-board";
import type { TicketLifecycleFilter } from "../tickets/tickets-kanban-constants";
import { ticketsModule } from "../tickets/tickets-module";

interface ProjectTicketsSectionProps {
  projectId: string;
  surface: ResourceSurface;
  /** Sin Card propia (p. ej. dentro de un accordion). */
  embedded?: boolean;
}

export function ProjectTicketsSection({
  projectId,
  surface,
  embedded = false,
}: ProjectTicketsSectionProps) {
  const { claims, isLoading: isAuthLoading } = useAuth();
  const canAccess = canAccessModule(claims, ticketsModule);
  const canCreate =
    isSuperAdmin(claims) && hasPermission(claims, "tickets:create");

  const [isLoading, setIsLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [lifecycle, setLifecycle] = React.useState<TicketLifecycleFilter>("active");
  const [workingOnly, setWorkingOnly] = React.useState(false);
  const [tickets, setTickets] = React.useState<
    Awaited<ReturnType<typeof listTickets>>
  >([]);

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setTickets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const ticketData = await listTickets(surface, {
        projectId,
        lifecycle,
        workingOnly,
      });
      setTickets(ticketData);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los tickets del proyecto.";
      setErrorMessage(message);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, claims, lifecycle, projectId, surface, workingOnly]);

  React.useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void reload();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isAuthLoading, reload]);

  if (!isAuthLoading && !canAccess) {
    return null;
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      {canCreate ? (
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus />
          Nuevo ticket
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void reload()}
        disabled={isLoading}
      >
        <RefreshCcw />
        Actualizar
      </Button>
    </div>
  );

  const body = (
    <div className="space-y-4">
      {embedded ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Solicitudes y seguimiento de trabajo del proyecto.
          </p>
          {toolbar}
        </div>
      ) : null}
      {errorMessage ? (
        <ErrorState message={errorMessage} onRetry={reload} />
      ) : (
        <TicketsKanbanBoard
          projectId={projectId}
          surface={surface}
          tickets={tickets}
          isLoading={isLoading || isAuthLoading}
          lifecycle={lifecycle}
          workingOnly={workingOnly}
          onLifecycleChange={setLifecycle}
          onWorkingOnlyChange={setWorkingOnly}
          onTicketsChange={setTickets}
        />
      )}
    </div>
  );

  return (
    <>
      {embedded ? (
        body
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Tickets</CardTitle>
              <CardDescription>
                Solicitudes y seguimiento de trabajo del proyecto.
              </CardDescription>
            </div>
            {toolbar}
          </CardHeader>
          <CardContent className="pt-6">{body}</CardContent>
        </Card>
      )}

      {canCreate ? (
        <TicketCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          projectId={projectId}
          surface={surface}
          onCreated={reload}
        />
      ) : null}
    </>
  );
}
