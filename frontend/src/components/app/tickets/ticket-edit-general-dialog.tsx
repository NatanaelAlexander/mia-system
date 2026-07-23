"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  listTicketCategories,
  listTicketPriorities,
  updateTicket,
  type TicketCatalogItem,
  type TicketDetail,
} from "@/components/app/api/tickets";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketEditGeneralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: TicketDetail;
  onUpdated: (ticket: TicketDetail) => void;
}

export function TicketEditGeneralDialog({
  open,
  onOpenChange,
  ticket,
  onUpdated,
}: TicketEditGeneralDialogProps) {
  const [isLoadingCatalogs, setIsLoadingCatalogs] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [priorities, setPriorities] = React.useState<TicketCatalogItem[]>([]);
  const [categories, setCategories] = React.useState<TicketCatalogItem[]>([]);
  const [description, setDescription] = React.useState(
    ticket.description ?? "",
  );
  const [priorityId, setPriorityId] = React.useState(ticket.priorityId);
  const [categoryId, setCategoryId] = React.useState(ticket.categoryId ?? "");

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDescription(ticket.description ?? "");
    setPriorityId(ticket.priorityId);
    setCategoryId(ticket.categoryId ?? "");

    let cancelled = false;
    setIsLoadingCatalogs(true);

    void Promise.all([listTicketPriorities("internal"), listTicketCategories("internal")])
      .then(([priorityData, categoryData]) => {
        if (cancelled) {
          return;
        }
        setPriorities(priorityData);
        setCategories(categoryData);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "No se pudieron cargar prioridad y categoría.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCatalogs(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, ticket]);

  const priorityItems = React.useMemo(
    () => priorities.map((item) => ({ value: item.id, label: item.name })),
    [priorities],
  );
  const categoryItems = React.useMemo(
    () => [
      { value: "", label: "Sin categoría" },
      ...categories.map((item) => ({ value: item.id, label: item.name })),
    ],
    [categories],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!priorityId) {
      toast.error("Selecciona una prioridad");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateTicket(ticket.id, {
        description: description.trim() || null,
        priorityId,
        categoryId: categoryId || null,
      });
      onUpdated(updated);
      onOpenChange(false);
      toast.success("Datos del ticket actualizados");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Editar datos generales</DialogTitle>
            <DialogDescription>
              Prioridad, categoría y descripción del ticket. Solo superAdmin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="ticket-edit-priority">Prioridad</Label>
            <Select
              items={priorityItems}
              value={priorityId}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  setPriorityId(value);
                }
              }}
              disabled={isSubmitting || isLoadingCatalogs}
            >
              <SelectTrigger id="ticket-edit-priority" className="w-full">
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                {priorityItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-edit-category">Categoría</Label>
            <Select
              items={categoryItems}
              value={categoryId}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  setCategoryId(value);
                }
              }}
              disabled={isSubmitting || isLoadingCatalogs}
            >
              <SelectTrigger id="ticket-edit-category" className="w-full">
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value || "none"} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-edit-description">Descripción</Label>
            <textarea
              id="ticket-edit-description"
              rows={5}
              value={description}
              disabled={isSubmitting}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe el ticket..."
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingCatalogs}>
              {isSubmitting ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
