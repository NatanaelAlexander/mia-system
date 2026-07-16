"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
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
import { listUsers, type UserListItem } from "@/components/app/api/users";
import { hasPermission } from "@/components/app/shared/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { TicketAssigneeCandidateList } from "./ticket-assignee-candidate-list";

interface UseTicketManagementOptions {
  ticket: TicketDetail | null;
  onTicketChange: (ticket: TicketDetail) => void;
  enabled?: boolean;
}

function useTicketManagement({
  ticket,
  onTicketChange,
  enabled = true,
}: UseTicketManagementOptions) {
  const { claims } = useAuth();
  const isSuperAdmin = claims?.roles.includes("super_admin") ?? false;
  const isAdmin = claims?.roles.includes("admin") ?? false;
  const ticketId = ticket?.id ?? null;

  const [assignees, setAssignees] = React.useState<TicketAssignee[]>([]);
  const [statuses, setStatuses] = React.useState<TicketCatalogItem[]>([]);
  const [candidates, setCandidates] = React.useState<UserListItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingAssignees, setIsSavingAssignees] = React.useState(false);
  const [isChangingStatus, setIsChangingStatus] = React.useState(false);

  const canChangeStatus =
    Boolean(claims) &&
    hasPermission(claims, "tickets:change_status") &&
    (isSuperAdmin ||
      (isAdmin && assignees.some((assignee) => assignee.id === claims?.sub)));

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

        const uniqueCandidates = new Map<string, UserListItem>();
        [...superAdminUsers, ...adminUsers].forEach((user) => {
          uniqueCandidates.set(user.id, user);
        });

        setAssignees(assigneeData);
        setSelectedIds(
          assigneeData
            .filter((assignee) => uniqueCandidates.has(assignee.id))
            .map((assignee) => assignee.id),
        );
        setStatuses(statusData.filter((status) => status.name !== "Borrador"));
        setCandidates([...uniqueCandidates.values()]);
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
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No se pudo cambiar el estado.",
      );
    } finally {
      setIsChangingStatus(false);
    }
  };

  const toggleCandidate = (userId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((id) => id !== userId),
    );
  };

  const saveAssignees = async () => {
    if (!ticketId) {
      return;
    }
    setIsSavingAssignees(true);
    try {
      const updated = await replaceTicketAssignees(ticketId, selectedIds);
      setAssignees(updated);
      setSelectedIds(updated.map((assignee) => assignee.id));
      toast.success("Responsables actualizados");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No se pudieron actualizar los responsables.",
      );
    } finally {
      setIsSavingAssignees(false);
    }
  };

  return {
    isSuperAdmin,
    assignees,
    statuses,
    candidates,
    selectedIds,
    isLoading,
    isSavingAssignees,
    isChangingStatus,
    canChangeStatus,
    handleStatusChange,
    toggleCandidate,
    saveAssignees,
  };
}

type TicketManagement = ReturnType<typeof useTicketManagement>;

export function TicketStatusControl({
  ticket,
  management,
}: {
  ticket: TicketDetail;
  management: TicketManagement;
}) {
  const {
    statuses,
    isLoading,
    isChangingStatus,
    canChangeStatus,
    handleStatusChange,
  } = management;

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
        <p className="text-base font-semibold text-foreground">
          {ticket.statusName}
        </p>
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
    selectedIds,
    isLoading,
    isSavingAssignees,
    toggleCandidate,
    saveAssignees,
  } = management;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Responsables
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {isLoading ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando...
            </span>
          ) : assignees.length > 0 ? (
            assignees.map((assignee) => (
              <Badge key={assignee.id} variant="secondary">
                {assignee.firstName} {assignee.lastName}
                {assignee.isSuperAdmin ? " · Superadmin" : ""}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              Sin responsables
            </span>
          )}
        </div>
      </div>

      {isSuperAdmin && !isLoading ? (
        <div className="space-y-2 rounded-lg border border-border/70 p-3">
          <p className="text-sm font-medium">Asignar equipo</p>
          <TicketAssigneeCandidateList
            candidates={candidates}
            selectedIds={selectedIds}
            isDisabled={isSavingAssignees}
            isMandatory={(userId) =>
              assignees.some(
                (assignee) =>
                  assignee.id === userId && assignee.isSuperAdmin,
              )
            }
            onToggle={toggleCandidate}
            gridClassName="grid gap-1 sm:grid-cols-2 lg:grid-cols-3"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => void saveAssignees()}
            disabled={isSavingAssignees}
          >
            {isSavingAssignees ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            Guardar responsables
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { useTicketManagement };
