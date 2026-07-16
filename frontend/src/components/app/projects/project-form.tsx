"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { ProjectStatus, ProjectType } from "@/components/app/api/projects";
import type { CompanyListItem } from "@/components/app/api/companies";
import { formatProjectStatus } from "@/components/app/shared/format";
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

const createProjectSchema = z.object({
  companyId: z.string().uuid("Selecciona una empresa"),
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  description: z.string().max(5000).optional().or(z.literal("")),
  type: z.enum(["internal", "external"]),
});

const editProjectSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  description: z.string().max(5000).optional().or(z.literal("")),
  type: z.enum(["internal", "external"]),
  status: z.enum(["active", "inactive", "completed"]),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
export type EditProjectFormValues = z.infer<typeof editProjectSchema>;

const typeOptions = [
  { label: "Externo (visible para el cliente)", value: "external" as const },
  { label: "Interno (solo equipo)", value: "internal" as const },
];

const statusOptions: Array<{ label: string; value: ProjectStatus }> = [
  { label: formatProjectStatus("active"), value: "active" },
  { label: formatProjectStatus("inactive"), value: "inactive" },
  { label: formatProjectStatus("completed"), value: "completed" },
];

const emptyCreateValues: CreateProjectFormValues = {
  companyId: "",
  name: "",
  description: "",
  type: "external",
};

const textareaClassName =
  "flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

interface ProjectCreateFormProps {
  companies: CompanyListItem[];
  defaultValues?: Partial<CreateProjectFormValues>;
  onSubmit: (values: CreateProjectFormValues) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function ProjectCreateForm({
  companies,
  defaultValues,
  onSubmit,
  submitLabel = "Crear proyecto",
  isSubmitting = false,
}: ProjectCreateFormProps) {
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { ...emptyCreateValues, ...defaultValues },
  });

  const companyItems = React.useMemo(
    () =>
      companies.map((company) => ({
        value: company.id,
        label: company.name,
      })),
    [companies],
  );

  const typeItems = typeOptions.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="project-company">Empresa</Label>
        <Controller
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <Select
              items={[
                { label: "Selecciona una empresa", value: null },
                ...companyItems,
              ]}
              value={field.value || null}
              onValueChange={(value) =>
                field.onChange(typeof value === "string" ? value : "")
              }
              disabled={isSubmitting || companies.length === 0}
            >
              <SelectTrigger id="project-company">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companyItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.companyId ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.companyId.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-name">Nombre del proyecto</Label>
        <Input
          id="project-name"
          {...form.register("name")}
          disabled={isSubmitting}
          placeholder="Ej. Portal cliente 2026"
        />
        {form.formState.errors.name ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description">Descripción (opcional)</Label>
        <textarea
          id="project-description"
          rows={3}
          disabled={isSubmitting}
          className={textareaClassName}
          placeholder="Resumen del alcance o objetivo del proyecto"
          {...form.register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-type">Tipo</Label>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Select
              items={typeItems}
              value={field.value as ProjectType}
              onValueChange={(value) =>
                field.onChange(
                  typeof value === "string" ? (value as ProjectType) : "external",
                )
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="project-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.type ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.type.message}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting || companies.length === 0}>
          {isSubmitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface ProjectEditFormProps {
  companyName: string;
  defaultValues: EditProjectFormValues;
  onSubmit: (values: EditProjectFormValues) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function ProjectEditForm({
  companyName,
  defaultValues,
  onSubmit,
  submitLabel = "Guardar cambios",
  isSubmitting = false,
}: ProjectEditFormProps) {
  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues,
  });

  const typeItems = typeOptions.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const statusItems = statusOptions.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="project-company-readonly">Empresa</Label>
        <Input
          id="project-company-readonly"
          value={companyName}
          disabled
          readOnly
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-edit-name">Nombre del proyecto</Label>
        <Input
          id="project-edit-name"
          {...form.register("name")}
          disabled={isSubmitting}
        />
        {form.formState.errors.name ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-edit-description">Descripción (opcional)</Label>
        <textarea
          id="project-edit-description"
          rows={3}
          disabled={isSubmitting}
          className={textareaClassName}
          placeholder="Resumen del alcance o objetivo del proyecto"
          {...form.register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-edit-type">Tipo</Label>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Select
              items={typeItems}
              value={field.value as ProjectType}
              onValueChange={(value) =>
                field.onChange(
                  typeof value === "string" ? (value as ProjectType) : "external",
                )
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="project-edit-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-edit-status">Estado</Label>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <Select
              items={statusItems}
              value={field.value as ProjectStatus}
              onValueChange={(value) =>
                field.onChange(
                  typeof value === "string"
                    ? (value as ProjectStatus)
                    : "active",
                )
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="project-edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
