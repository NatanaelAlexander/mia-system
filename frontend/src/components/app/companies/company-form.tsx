"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CompanyStatus } from "@/components/app/api/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const companySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  taxId: z.string().min(1, "El RUT es obligatorio").max(50),
  email: z
    .string()
    .email("Ingresa un correo válido")
    .optional()
    .or(z.literal("")),
  phoneNumber: z.string().max(50).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  defaultValues: CompanyFormValues;
  onSubmit: (values: CompanyFormValues) => Promise<void>;
  submitLabel?: string;
  readOnly?: boolean;
  isSubmitting?: boolean;
}

const selectClassName = cn(
  "flex h-8 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:opacity-50",
);

export function CompanyForm({
  defaultValues,
  onSubmit,
  submitLabel = "Guardar",
  readOnly = false,
  isSubmitting = false,
}: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues,
  });

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            disabled={readOnly}
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">RUT</Label>
          <Input
            id="taxId"
            disabled={readOnly}
            placeholder="76123456-7"
            aria-invalid={Boolean(errors.taxId)}
            {...register("taxId")}
          />
          {errors.taxId ? (
            <p className="text-sm text-destructive">{errors.taxId.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            disabled={readOnly}
            className={selectClassName}
            {...register("status")}
          >
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            disabled={readOnly}
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Teléfono</Label>
          <Input
            id="phoneNumber"
            type="tel"
            disabled={readOnly}
            {...register("phoneNumber")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            disabled={readOnly}
            {...register("address")}
          />
        </div>
      </div>

      {!readOnly ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Guardando..." : submitLabel}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

export function toCompanyFormValues(company: {
  name: string;
  taxId: string;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  status: CompanyStatus;
}): CompanyFormValues {
  return {
    name: company.name,
    taxId: company.taxId,
    email: company.email ?? "",
    phoneNumber: company.phoneNumber ?? "",
    address: company.address ?? "",
    status: company.status,
  };
}

export function toCompanyPayload(values: CompanyFormValues) {
  return {
    name: values.name.trim(),
    taxId: values.taxId.trim(),
    email: values.email?.trim() || undefined,
    phoneNumber: values.phoneNumber?.trim() || undefined,
    address: values.address?.trim() || undefined,
    status: values.status,
  };
}
