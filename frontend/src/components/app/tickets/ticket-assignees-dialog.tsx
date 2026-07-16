"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  listTicketAssignees,
  replaceTicketAssignees,
  type TicketAssignee,
} from "@/components/app/api/tickets";
import { listUsers, type UserListItem } from "@/components/app/api/users";
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
import { TicketAssigneeCandidateList } from "./ticket-assignee-candidate-list";

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
  const [candidates, setCandidates] = React.useState<UserListItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
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
        setCandidates([...uniqueCandidates.values()]);
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

  const toggleCandidate = (userId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((id) => id !== userId),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await replaceTicketAssignees(ticketId, selectedIds);
      setAssignees(updated);
      setSelectedIds(updated.map((assignee) => assignee.id));
      onSaved(updated);
      toast.success("Responsables actualizados");
      onOpenChange(false);
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
            selectedIds={selectedIds}
            isDisabled={isSaving}
            isMandatory={(userId) =>
              assignees.some(
                (assignee) =>
                  assignee.id === userId && assignee.isSuperAdmin,
              )
            }
            onToggle={toggleCandidate}
          />
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isLoading || isSaving}
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
