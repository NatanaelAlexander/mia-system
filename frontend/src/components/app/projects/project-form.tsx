"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { ProjectType } from "@/components/app/api/projects";
import type { CompanyListItem } from "@/components/app/api/companies";
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

const projectSchema = z.object({
  companyId: z.string().uuid("Selecciona una empresa"),
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  type: z.enum(["internal", "external"]),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

const typeOptions = [
  { label: "Externo (visible para el cliente)", value: "external" as const },
  { label: "Interno (solo equipo)", value: "internal" as const },
];

interface ProjectFormProps {
  companies: CompanyListItem[];
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const emptyValues: ProjectFormValues = {
  companyId: "",
  name: "",
  type: "external",
};

export function ProjectForm({
  companies,
  defaultValues,
  onSubmit,
  submitLabel = "Crear proyecto",
  isSubmitting = false,
}: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { ...emptyValues, ...defaultValues },
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
