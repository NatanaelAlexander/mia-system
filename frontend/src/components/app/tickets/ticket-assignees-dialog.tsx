"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listTicketAssignees,
  replaceTicketAssignees,
  type TicketAssignee,
} from "@/components/app/api/tickets";
import { listUsers } from "@/components/app/api/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/errors";
import {
  mergeAssigneeCandidates,
  TicketAssigneeCandidateList,
  type TicketAssigneeCandidate,
} from "./ticket-assignee-candidate-list";

interface TicketAssigneesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketTitle: string;
  onSaved: (assignees: TicketAssignee[]) => void;
}

export function TicketAssigneesDialog({
  open,
  onOpenChange,
  ticketId,
  ticketTitle,
  onSaved,
}: TicketAssigneesDialogProps) {
  const [assignees, setAssignees] = React.useState<TicketAssignee[]>([]);
  const [candidates, setCandidates] = React.useState<TicketAssigneeCandidate[]>(
    [],
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [assigneeData, adminUsers, superAdminUsers] = await Promise.all([
          listTicketAssignees(ticketId),
          listUsers({ isActive: true, roleName: "admin" }),
          listUsers({ isActive: true, roleName: "super_admin" }),
        ]);

        if (cancelled) {
          return;
        }

        setAssignees(assigneeData);
        setCandidates(mergeAssigneeCandidates(superAdminUsers, adminUsers));
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "No se pudieron cargar los responsables.",
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
  }, [open, ticketId]);

  const persistAssignees = async (userIds: string[]) => {
    setIsSaving(true);
    try {
      const updated = await replaceTicketAssignees(ticketId, userIds);
      setAssignees(updated);
      onSaved(updated);
      toast.success("Responsables actualizados");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No se pudieron actualizar los responsables.",
      );
    } finally {
      setIsSaving(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Responsables del ticket</DialogTitle>
          <DialogDescription>{ticketTitle}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando responsables...
          </div>
        ) : (
          <TicketAssigneeCandidateList
            candidates={candidates}
            assignees={assignees}
            isSaving={isSaving}
            isMandatory={(userId) =>
              assignees.some(
                (assignee) =>
                  assignee.id === userId && assignee.isSuperAdmin,
              )
            }
            onAdd={(userId) => void addAssignee(userId)}
            onRemove={(userId) => void removeAssignee(userId)}
          />
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
