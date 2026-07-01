"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import type { CompanyStatus } from "@/components/app/api/companies";
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
import {
  formatRutInput,
  normalizeRutForStorage,
  validateRut,
} from "@/components/app/shared/rut";

const statusOptions = [
  { label: "Activa", value: "active" },
  { label: "Inactiva", value: "inactive" },
] as const;

function buildCompanySchema(validateTaxId: boolean) {
  return z.object({
    name: z.string().min(1, "El nombre es obligatorio").max(255),
    taxId: validateTaxId
      ? z
          .string()
          .min(1, "El RUT es obligatorio")
          .max(50)
          .refine(validateRut, "El RUT no es válido")
      : z.string().min(1, "El RUT es obligatorio").max(50),
    email: z
      .string()
      .email("Ingresa un correo válido")
      .optional()
      .or(z.literal("")),
    phoneNumber: z.string().max(50).optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    status: z.enum(["active", "inactive"]),
  });
}

type CompanyFormValues = z.infer<ReturnType<typeof buildCompanySchema>>;

export type { CompanyFormValues };

export interface CompanyFormSubmitMeta {
  dirtyFields: Partial<Record<keyof CompanyFormValues, boolean | undefined>>;
}

interface CompanyFormProps {
  defaultValues: CompanyFormValues;
  mode?: "create" | "edit";
  onSubmit: (
    values: CompanyFormValues,
    meta: CompanyFormSubmitMeta,
  ) => Promise<void>;
  submitLabel?: string;
  readOnly?: boolean;
  isSubmitting?: boolean;
}

export function CompanyForm({
  defaultValues,
  mode = "edit",
  onSubmit,
  submitLabel = "Guardar",
  readOnly = false,
  isSubmitting = false,
}: CompanyFormProps) {
  const companySchema = React.useMemo(
    () => buildCompanySchema(mode === "create"),
    [mode],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues,
  });

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submitForm = handleSubmit(async (values) => {
    if (mode === "edit" && dirtyFields.taxId && !validateRut(values.taxId)) {
      setError("taxId", { message: "El RUT no es válido" });
      return;
    }

    await onSubmit(values, { dirtyFields });
  });

  return (
    <form onSubmit={submitForm} className="space-y-4">
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
          <Controller
            name="taxId"
            control={control}
            render={({ field }) => (
              <Input
                id="taxId"
                disabled={readOnly}
                placeholder="12.345.678-5"
                inputMode="text"
                autoComplete="off"
                aria-invalid={Boolean(errors.taxId)}
                value={field.value}
                onChange={(event) => {
                  field.onChange(formatRutInput(event.target.value));
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          />
          {errors.taxId ? (
            <p className="text-sm text-destructive">{errors.taxId.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                items={[...statusOptions]}
                value={field.value}
                onValueChange={field.onChange}
                disabled={readOnly}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
  const taxId = normalizeRutForStorage(values.taxId.trim());

  return {
    name: values.name.trim(),
    ...(taxId ? { taxId } : {}),
    email: values.email?.trim() || undefined,
    phoneNumber: values.phoneNumber?.trim() || undefined,
    address: values.address?.trim() || undefined,
    status: values.status,
  };
}
