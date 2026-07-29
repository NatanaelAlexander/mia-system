"use client";

import * as React from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  changeTicketStatus,
  listTicketAssignees,
  listTicketStatuses,
  replaceTicketAssignees,
  type TicketAssignee,
  type TicketCatalogItem,
  type TicketDetail,
} from "@/components/app/api/tickets";
import { listUsers } from "@/components/app/api/users";
import { hasPermission } from "@/components/app/shared/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import {
  isAuthorizationDeniedError,
} from "@/components/app/shared/authorization-denied-dialog";
import {
  mergeAssigneeCandidates,
  TicketAssigneeCandidateList,
  type TicketAssigneeCandidate,
} from "./ticket-assignee-candidate-list";

interface UseTicketManagementOptions {
  ticket: TicketDetail | null;
  onTicketChange: (ticket: TicketDetail) => void;
  enabled?: boolean;
  onAuthorizationDenied?: () => void;
}

function useTicketManagement({
  ticket,
  onTicketChange,
  enabled = true,
  onAuthorizationDenied,
}: UseTicketManagementOptions) {
  const { claims } = useAuth();
  const isSuperAdmin = claims?.roles.includes("super_admin") ?? false;
  const isAdmin = claims?.roles.includes("admin") ?? false;
  const ticketId = ticket?.id ?? null;

  const [assignees, setAssignees] = React.useState<TicketAssignee[]>([]);
  const [statuses, setStatuses] = React.useState<TicketCatalogItem[]>([]);
  const [candidates, setCandidates] = React.useState<TicketAssigneeCandidate[]>(
    [],
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingAssignees, setIsSavingAssignees] = React.useState(false);
  const [isChangingStatus, setIsChangingStatus] = React.useState(false);

  const canChangeStatus =
    Boolean(claims) &&
    hasPermission(claims, "tickets:change_status") &&
    (isSuperAdmin ||
      (isAdmin && assignees.some((assignee) => assignee.id === claims?.sub)));

  const syncAssignees = (updated: TicketAssignee[]) => {
    setAssignees(updated);
    if (ticket) {
      onTicketChange({ ...ticket, assignees: updated });
    }
  };

  React.useEffect(() => {
    if (!enabled || !ticketId) {
      return;
    }

    const id = ticketId;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [assigneeData, statusData, adminUsers, superAdminUsers] =
          await Promise.all([
            listTicketAssignees(id),
            listTicketStatuses("internal"),
            isSuperAdmin
              ? listUsers({ isActive: true, roleName: "admin" })
              : Promise.resolve([]),
            isSuperAdmin
              ? listUsers({ isActive: true, roleName: "super_admin" })
              : Promise.resolve([]),
          ]);

        if (cancelled) {
          return;
        }

        setAssignees(assigneeData);
        setStatuses(statusData.filter((status) => status.name !== "Borrador"));
        setCandidates(mergeAssigneeCandidates(superAdminUsers, adminUsers));
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "No se pudieron cargar los responsables y estados.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, isSuperAdmin, ticketId]);

  const handleStatusChange = async (statusId: string | null) => {
    if (
      !ticketId ||
      !statusId ||
      statusId === ticket?.statusId ||
      !canChangeStatus
    ) {
      return;
    }

    setIsChangingStatus(true);
    try {
      const updated = await changeTicketStatus(ticketId, statusId);
      onTicketChange(updated);
      toast.success("Estado actualizado");
    } catch (error) {
      if (isAuthorizationDeniedError(error)) {
        onAuthorizationDenied?.();
      } else {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudo cambiar el estado.",
        );
      }
    } finally {
      setIsChangingStatus(false);
    }
  };

  const persistAssignees = async (userIds: string[]) => {
    if (!ticketId) {
      return;
    }

    setIsSavingAssignees(true);
    try {
      const updated = await replaceTicketAssignees(ticketId, userIds);
      syncAssignees(updated);
      toast.success("Responsables actualizados");
    } catch (error) {
      if (isAuthorizationDeniedError(error)) {
        onAuthorizationDenied?.();
      } else {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudieron actualizar los responsables.",
        );
      }
    } finally {
      setIsSavingAssignees(false);
    }
  };

  const addAssignee = async (userId: string) => {
    if (assignees.some((assignee) => assignee.id === userId)) {
      return;
    }
    await persistAssignees([...assignees.map((item) => item.id), userId]);
  };

  const removeAssignee = async (userId: string) => {
    if (
      assignees.some(
        (assignee) => assignee.id === userId && assignee.isSuperAdmin,
      )
    ) {
      return;
    }
    await persistAssignees(
      assignees.filter((item) => item.id !== userId).map((item) => item.id),
    );
  };

  return {
    isSuperAdmin,
    assignees,
    statuses,
    candidates,
    isLoading,
    isSavingAssignees,
    isChangingStatus,
    canChangeStatus,
    handleStatusChange,
    addAssignee,
    removeAssignee,
  };
}

type TicketManagement = ReturnType<typeof useTicketManagement>;

export function TicketStatusControl({
  ticket,
  management,
  onDenied,
  compact = false,
}: {
  ticket: TicketDetail;
  management: TicketManagement;
  onDenied?: () => void;
  /** Dropdown compacto para el encabezado (sin label arriba). */
  compact?: boolean;
}) {
  const {
    statuses,
    isLoading,
    isChangingStatus,
    canChangeStatus,
    handleStatusChange,
  } = management;

  if (compact) {
    if (canChangeStatus) {
      return (
        <Select
          items={statuses.map((status) => ({
            value: status.id,
            label: status.name,
          }))}
          value={ticket.statusId}
          onValueChange={handleStatusChange}
          disabled={isLoading || isChangingStatus}
        >
          <SelectTrigger className="w-[min(100%,12rem)] sm:w-44">
            <SelectValue
              placeholder={
                isChangingStatus ? "Actualizando..." : ticket.statusName
              }
            />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <button
        type="button"
        className="inline-flex h-9 items-center rounded-lg border border-border/70 bg-muted/30 px-3 text-sm font-medium"
        onClick={() => onDenied?.()}
      >
        {ticket.statusName}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Estado
      </p>
      {canChangeStatus ? (
        <Select
          items={statuses.map((status) => ({
            value: status.id,
            label: status.name,
          }))}
          value={ticket.statusId}
          onValueChange={handleStatusChange}
          disabled={isLoading || isChangingStatus}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                isChangingStatus ? "Actualizando..." : ticket.statusName
              }
            />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <button
          type="button"
          className="text-left text-base font-semibold text-foreground"
          onClick={() => onDenied?.()}
        >
          {ticket.statusName}
        </button>
      )}
    </div>
  );
}

export function TicketAssigneesControl({
  management,
}: {
  management: TicketManagement;
}) {
  const {
    isSuperAdmin,
    assignees,
    candidates,
    isLoading,
    isSavingAssignees,
    addAssignee,
    removeAssignee,
  } = management;

  const [addOpen, setAddOpen] = React.useState(false);

  const isMandatory = (userId: string) =>
    assignees.some(
      (assignee) => assignee.id === userId && assignee.isSuperAdmin,
    );

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Responsables
        </p>

        {isLoading ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando...
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {assignees.length > 0 ? (
              assignees.map((assignee) => {
                const mandatory = isMandatory(assignee.id);
                const label =
                  `${assignee.firstName} ${assignee.lastName}`.trim();
                const roleHint = assignee.isSuperAdmin
                  ? "Superadmin"
                  : assignee.roles.includes("admin")
                    ? "Admin"
                    : "";

                return (
                  <Badge
                    key={assignee.id}
                    variant="secondary"
                    className="h-7 gap-1 pr-1"
                  >
                    <span className="max-w-[14rem] truncate">
                      {label}
                      {roleHint ? ` · ${roleHint}` : ""}
                    </span>
                    {isSuperAdmin && !mandatory ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-5 rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                        disabled={isSavingAssignees}
                        aria-label={`Quitar a ${label}`}
                        onClick={() => void removeAssignee(assignee.id)}
                      >
                        <X className="size-3!" />
                      </Button>
                    ) : null}
                  </Badge>
                );
              })
            ) : (
              <span className="text-sm text-muted-foreground">
                Sin responsables
              </span>
            )}

            {isSuperAdmin ? (
              <button
                type="button"
                disabled={isSavingAssignees}
                onClick={() => setAddOpen(true)}
                className={cn(
                  badgeVariants({ variant: "outline" }),
                  "h-7 cursor-pointer gap-1 border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
                  isSavingAssignees && "pointer-events-none opacity-60",
                )}
              >
                <Plus className="size-3.5" />
                Agregar responsable
              </button>
            ) : null}

            {isSavingAssignees ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Guardando...
              </span>
            ) : null}
          </div>
        )}
      </div>

      {isSuperAdmin ? (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar responsable</DialogTitle>
              <DialogDescription>
                Filtra y selecciona una persona para asignarla a este ticket.
              </DialogDescription>
            </DialogHeader>

            <TicketAssigneeCandidateList
              candidates={candidates}
              assignees={assignees}
              isSaving={isSavingAssignees}
              isMandatory={isMandatory}
              showAssigned={false}
              showAddHeading={false}
              onAdd={(userId) => void addAssignee(userId)}
              onRemove={(userId) => void removeAssignee(userId)}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={isSavingAssignees}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

export { useTicketManagement };
