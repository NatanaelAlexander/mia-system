"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  changeTicketStatus,
  listTicketStatuses,
  type TicketAssignee,
  type TicketCatalogItem,
  type TicketKanbanItem,
} from "@/components/app/api/tickets";
import {
  hasPermission,
  isInternalUser,
} from "@/components/app/shared/permissions";
import type { ResourceSurface } from "@/components/app/api/types";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketAssigneesDialog } from "./ticket-assignees-dialog";
import { TicketKanbanCard } from "./ticket-kanban-card";
import {
  KANBAN_STATUS_ORDER,
  type TicketLifecycleFilter,
} from "./tickets-kanban-constants";

interface TicketsKanbanBoardProps {
  projectId: string;
  surface: ResourceSurface;
  tickets: TicketKanbanItem[];
  isLoading?: boolean;
  lifecycle: TicketLifecycleFilter;
  workingOnly: boolean;
  onLifecycleChange: (value: TicketLifecycleFilter) => void;
  onWorkingOnlyChange: (value: boolean) => void;
  onTicketsChange: (tickets: TicketKanbanItem[]) => void;
}

function canDragTicket(
  ticket: TicketKanbanItem,
  claims: ReturnType<typeof useAuth>["claims"],
): boolean {
  if (!claims || !isInternalUser(claims)) {
    return false;
  }
  if (!hasPermission(claims, "tickets:change_status")) {
    return false;
  }
  if (claims.roles.includes("super_admin")) {
    return true;
  }
  if (!claims.roles.includes("admin")) {
    return false;
  }
  return (ticket.assignees ?? []).some((assignee) => assignee.id === claims.sub);
}

function sortStatuses(statuses: TicketCatalogItem[]) {
  const order = new Map(
    KANBAN_STATUS_ORDER.map((name, index) => [name, index]),
  );
  return [...statuses].sort((a, b) => {
    const left = order.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const right = order.get(b.name) ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

export function TicketsKanbanBoard({
  projectId,
  surface,
  tickets,
  isLoading = false,
  lifecycle,
  workingOnly,
  onLifecycleChange,
  onWorkingOnlyChange,
  onTicketsChange,
}: TicketsKanbanBoardProps) {
  const { claims } = useAuth();
  const isInternal = isInternalUser(claims);
  const isSuperAdmin = claims?.roles.includes("super_admin") ?? false;

  const [statuses, setStatuses] = React.useState<TicketCatalogItem[]>([]);
  const [draggingTicketId, setDraggingTicketId] = React.useState<string | null>(
    null,
  );
  const [dropTargetStatusId, setDropTargetStatusId] = React.useState<
    string | null
  >(null);
  const [assigneeDialogTicket, setAssigneeDialogTicket] =
    React.useState<TicketKanbanItem | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadStatuses() {
      try {
        const data = await listTicketStatuses(surface);
        if (!cancelled) {
          setStatuses(
            sortStatuses(data.filter((status) => status.name !== "Borrador")),
          );
        }
      } catch {
        if (!cancelled) {
          setStatuses([]);
        }
      }
    }

    void loadStatuses();
    return () => {
      cancelled = true;
    };
  }, [surface]);

  const filteredTickets = tickets;

  const ticketsByStatus = React.useMemo(() => {
    const map = new Map<string, TicketKanbanItem[]>();
    for (const status of statuses) {
      map.set(status.id, []);
    }
    for (const ticket of filteredTickets) {
      const bucket = map.get(ticket.statusId);
      if (bucket) {
        bucket.push(ticket);
      }
    }
    return map;
  }, [filteredTickets, statuses]);

  const handleDrop = async (statusId: string) => {
    if (!draggingTicketId || !claims) {
      return;
    }

    const ticket = tickets.find((item) => item.id === draggingTicketId);
    if (!ticket || ticket.statusId === statusId || !canDragTicket(ticket, claims)) {
      setDraggingTicketId(null);
      setDropTargetStatusId(null);
      return;
    }

    const previous = tickets;
    const nextStatus = statuses.find((status) => status.id === statusId);
    onTicketsChange(
      tickets.map((item) =>
        item.id === draggingTicketId
          ? {
              ...item,
              statusId,
              statusName: nextStatus?.name ?? item.statusName,
              isClosed:
                nextStatus?.name === "Terminado" ||
                nextStatus?.name === "Cancelado",
              isWorking: ["Tomado", "En desarrollo", "QA", "Esperando cliente"].includes(
                nextStatus?.name ?? "",
              ),
            }
          : item,
      ),
    );

    try {
      const updated = await changeTicketStatus(draggingTicketId, statusId);
      onTicketsChange(
        tickets.map((item) =>
          item.id === draggingTicketId
            ? {
                ...item,
                ...updated,
                assignees: item.assignees,
                lastCommentAuthorFirstName: item.lastCommentAuthorFirstName,
                lastCommentAuthorLastName: item.lastCommentAuthorLastName,
                lastCommentAt: item.lastCommentAt,
                isClosed:
                  updated.statusName === "Terminado" ||
                  updated.statusName === "Cancelado",
                isWorking: [
                  "Tomado",
                  "En desarrollo",
                  "QA",
                  "Esperando cliente",
                ].includes(updated.statusName),
              }
            : item,
        ),
      );
      toast.success("Estado actualizado");
    } catch (error) {
      onTicketsChange(previous);
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No se pudo mover el ticket.",
      );
    } finally {
      setDraggingTicketId(null);
      setDropTargetStatusId(null);
    }
  };

  const handleAssigneesSaved = (ticketId: string, assignees: TicketAssignee[]) => {
    onTicketsChange(
      tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, assignees } : ticket,
      ),
    );
  };

  const lifecycleItems = [
    { value: "active", label: "Activos" },
    { value: "closed", label: "Cerrados" },
    { value: "all", label: "Todos" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando tablero...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={lifecycleItems}
            value={lifecycle}
            onValueChange={(value) =>
              onLifecycleChange(
                (value as TicketLifecycleFilter | null) ?? "active",
              )
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar tickets" />
            </SelectTrigger>
            <SelectContent>
              {lifecycleItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            size="sm"
            variant={workingOnly ? "default" : "outline"}
            onClick={() => onWorkingOnlyChange(!workingOnly)}
          >
            En trabajo
          </Button>
        </div>

        {isInternal ? (
          <p className="text-xs text-muted-foreground">
            Arrastra las tarjetas para cambiar el estado si tienes permiso.
          </p>
        ) : null}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {statuses.map((status) => {
          const columnTickets = ticketsByStatus.get(status.id) ?? [];
          const isDropTarget = dropTargetStatusId === status.id;

          return (
            <section
              key={status.id}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border border-border/70 bg-muted/20",
                isDropTarget && "border-primary ring-2 ring-primary/20",
              )}
              onDragOver={(event) => {
                if (!draggingTicketId || !isInternal) {
                  return;
                }
                event.preventDefault();
                setDropTargetStatusId(status.id);
              }}
              onDragLeave={() => {
                if (dropTargetStatusId === status.id) {
                  setDropTargetStatusId(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                void handleDrop(status.id);
              }}
            >
              <header className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <h3 className="text-sm font-semibold">{status.name}</h3>
                <Badge variant="secondary">{columnTickets.length}</Badge>
              </header>

              <div className="flex min-h-32 flex-col gap-2 p-2">
                {columnTickets.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                    Sin tickets
                  </p>
                ) : (
                  columnTickets.map((ticket) => (
                    <TicketKanbanCard
                      key={ticket.id}
                      ticket={ticket}
                      projectId={projectId}
                      draggable={canDragTicket(ticket, claims)}
                      canManageAssignees={isSuperAdmin}
                      onEditAssignees={setAssigneeDialogTicket}
                      onDragStart={setDraggingTicketId}
                      onDragEnd={() => {
                        setDraggingTicketId(null);
                        setDropTargetStatusId(null);
                      }}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {assigneeDialogTicket ? (
        <TicketAssigneesDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setAssigneeDialogTicket(null);
            }
          }}
          ticketId={assigneeDialogTicket.id}
          ticketTitle={assigneeDialogTicket.title}
          onSaved={(assignees) =>
            handleAssigneesSaved(assigneeDialogTicket.id, assignees)
          }
        />
      ) : null}
    </div>
  );
}
