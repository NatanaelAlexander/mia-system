"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { TicketCatalogItem } from "@/components/app/api/tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const createTicketSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(255),
  description: z.string().max(5000).optional(),
  priorityId: z.string().uuid("Selecciona una prioridad"),
  categoryId: z.string().optional(),
  paymentStatusId: z.string().optional(),
});

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

const emptyValues: CreateTicketFormValues = {
  title: "",
  description: "",
  priorityId: "",
  categoryId: "",
  paymentStatusId: "",
};

interface TicketCreateFormProps {
  priorities: TicketCatalogItem[];
  categories: TicketCatalogItem[];
  paymentStatuses: TicketCatalogItem[];
  defaultValues?: Partial<CreateTicketFormValues>;
  onSubmit: (values: CreateTicketFormValues) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

function toSelectItems(items: TicketCatalogItem[]) {
  return items.map((item) => ({ value: item.id, label: item.name }));
}

export function TicketCreateForm({
  priorities,
  categories,
  paymentStatuses,
  defaultValues,
  onSubmit,
  submitLabel = "Crear ticket",
  isSubmitting = false,
}: TicketCreateFormProps) {
  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { ...emptyValues, ...defaultValues },
  });

  const priorityItems = React.useMemo(
    () => toSelectItems(priorities),
    [priorities],
  );
  const categoryItems = React.useMemo(
    () => [{ value: "", label: "Sin categoría" }, ...toSelectItems(categories)],
    [categories],
  );
  const paymentItems = React.useMemo(
    () => [
      { value: "", label: "Sin estado de pago" },
      ...toSelectItems(paymentStatuses),
    ],
    [paymentStatuses],
  );

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          description: values.description?.trim() || undefined,
          categoryId: values.categoryId || undefined,
          paymentStatusId: values.paymentStatusId || undefined,
        });
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="ticket-title">Título</Label>
        <Input
          id="ticket-title"
          disabled={isSubmitting}
          {...form.register("title")}
        />
        {form.formState.errors.title ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-description">Descripción (opcional)</Label>
        <textarea
          id="ticket-description"
          rows={4}
          disabled={isSubmitting}
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
          {...form.register("description")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ticket-priority">Prioridad</Label>
          <Controller
            control={form.control}
            name="priorityId"
            render={({ field }) => (
              <Select
                items={priorityItems}
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(typeof value === "string" ? value : "")
                }
              >
                <SelectTrigger id="ticket-priority" className="w-full">
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
            )}
          />
          {form.formState.errors.priorityId ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.priorityId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-category">Categoría</Label>
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Select
                items={categoryItems}
                value={field.value ?? ""}
                onValueChange={(value) =>
                  field.onChange(typeof value === "string" ? value : "")
                }
              >
                <SelectTrigger id="ticket-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((item) => (
                    <SelectItem key={item.value || "none"} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creando..." : submitLabel}
      </Button>
    </form>
  );
}
