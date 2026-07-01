"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { JobTitleOption, RoleOption } from "@/components/app/api/users";
import { formatRole } from "@/components/app/shared/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const PORTAL_CLIENT_ROLE = "cliente";
export const INTERNAL_ROLE_NAMES = new Set(["admin", "super_admin"]);

const userSchema = z.object({
  email: z.string().email("Ingresa un correo válido").max(255),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100)
    .optional()
    .or(z.literal("")),
  firstName: z.string().min(1, "El nombre es obligatorio").max(100),
  lastName: z.string().min(1, "El apellido es obligatorio").max(100),
  phoneNumber: z.string().max(50).optional().or(z.literal("")),
  isActive: z.boolean(),
  roleIds: z.array(z.string()).min(1, "Selecciona al menos un rol"),
  jobTitleIds: z.array(z.string()),
  companyIds: z.array(z.string()),
});

export type UserFormValues = z.infer<typeof userSchema>;

export interface UserFormSubmitMeta {
  dirtyFields: Partial<Record<keyof UserFormValues, boolean | undefined>>;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface UserFormProps {
  mode: "create" | "edit";
  defaultValues: UserFormValues;
  roleOptions: RoleOption[];
  jobTitleOptions: JobTitleOption[];
  companyOptions?: CompanyOption[];
  onSubmit: (values: UserFormValues, meta: UserFormSubmitMeta) => Promise<void>;
  submitLabel?: string;
  readOnly?: boolean;
  isSubmitting?: boolean;
  canEditRoles?: boolean;
  canEditJobTitles?: boolean;
  canEditCompanies?: boolean;
}

function roleNameById(roleOptions: RoleOption[], roleId: string) {
  return roleOptions.find((role) => role.id === roleId)?.name ?? "";
}

export function toUserFormValues(detail: {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  isActive: boolean;
  roleIds: string[];
  jobTitleIds: string[];
  companies: Array<{ id: string }>;
}): UserFormValues {
  return {
    email: detail.email,
    password: "",
    firstName: detail.firstName,
    lastName: detail.lastName,
    phoneNumber: detail.phoneNumber ?? "",
    isActive: detail.isActive,
    roleIds: detail.roleIds,
    jobTitleIds: detail.jobTitleIds,
    companyIds: detail.companies.map((company) => company.id),
  };
}

export function UserForm({
  mode,
  defaultValues,
  roleOptions,
  jobTitleOptions,
  companyOptions = [],
  onSubmit,
  submitLabel = "Guardar",
  readOnly = false,
  isSubmitting = false,
  canEditRoles = true,
  canEditJobTitles = true,
  canEditCompanies = true,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<UserFormValues>({
    resolver: zodResolver(
      mode === "create"
        ? userSchema.extend({
            password: z
              .string()
              .min(6, "La contraseña debe tener al menos 6 caracteres")
              .max(100),
          })
        : userSchema,
    ),
    defaultValues,
  });

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const roleIds = watch("roleIds");
  const jobTitleIds = watch("jobTitleIds");
  const companyIds = watch("companyIds");

  const selectedRoleNames = roleIds.map((id) => roleNameById(roleOptions, id));
  const showJobTitles = selectedRoleNames.some((name) => INTERNAL_ROLE_NAMES.has(name));
  const showCompanies = selectedRoleNames.includes(PORTAL_CLIENT_ROLE);

  const toggleId = (
    field: "roleIds" | "jobTitleIds" | "companyIds",
    id: string,
    checked: boolean,
  ) => {
    const current = getValues(field);
    setValue(
      field,
      checked ? [...current, id] : current.filter((item) => item !== id),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const submitForm = handleSubmit(async (values) => {
    await onSubmit(values, { dirtyFields });
  });

  return (
    <form className="space-y-5" onSubmit={submitForm}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="user-first-name">Nombre</Label>
          <Input
            id="user-first-name"
            disabled={readOnly || isSubmitting}
            {...register("firstName")}
          />
          {errors.firstName ? (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-last-name">Apellido</Label>
          <Input
            id="user-last-name"
            disabled={readOnly || isSubmitting}
            {...register("lastName")}
          />
          {errors.lastName ? (
            <p className="text-xs text-destructive">{errors.lastName.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="user-email">Correo</Label>
        <Input
          id="user-email"
          type="email"
          disabled={readOnly || isSubmitting}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      {mode === "create" ? (
        <div className="space-y-2">
          <Label htmlFor="user-password">Contraseña temporal</Label>
          <Input
            id="user-password"
            type="password"
            autoComplete="new-password"
            disabled={readOnly || isSubmitting}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="user-phone">Teléfono (opcional)</Label>
        <Input
          id="user-phone"
          disabled={readOnly || isSubmitting}
          {...register("phoneNumber")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={readOnly || isSubmitting}
          {...register("isActive")}
        />
        Usuario activo
      </label>

      <fieldset className="space-y-2" disabled={!canEditRoles || readOnly || isSubmitting}>
        <legend className="text-sm font-medium">Roles</legend>
        <p className="text-xs text-muted-foreground">
          Definen los permisos del usuario en el sistema.
        </p>
        <div className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-2">
          {roleOptions.map((role) => (
            <label
              key={role.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                roleIds.includes(role.id)
                  ? "border-primary/40 bg-primary/5"
                  : "border-transparent hover:bg-muted/40",
              )}
            >
              <input
                type="checkbox"
                checked={roleIds.includes(role.id)}
                onChange={(event) =>
                  toggleId("roleIds", role.id, event.target.checked)
                }
              />
              <span className="font-medium">{formatRole(role.name)}</span>
            </label>
          ))}
        </div>
        {errors.roleIds ? (
          <p className="text-xs text-destructive">{errors.roleIds.message}</p>
        ) : null}
      </fieldset>

      {showJobTitles ? (
        <fieldset
          className="space-y-2"
          disabled={!canEditJobTitles || readOnly || isSubmitting}
        >
          <legend className="text-sm font-medium">Cargos internos</legend>
          <p className="text-xs text-muted-foreground">
            Etiqueta visible del equipo (programador, QA, etc.). No cambia permisos.
          </p>
          <div className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-2">
            {jobTitleOptions.map((jobTitle) => (
              <label
                key={jobTitle.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  jobTitleIds.includes(jobTitle.id)
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:bg-muted/40",
                )}
              >
                <input
                  type="checkbox"
                  checked={jobTitleIds.includes(jobTitle.id)}
                  onChange={(event) =>
                    toggleId("jobTitleIds", jobTitle.id, event.target.checked)
                  }
                />
                <span>{jobTitle.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {showCompanies && companyOptions.length > 0 ? (
        <fieldset
          className="space-y-2"
          disabled={!canEditCompanies || readOnly || isSubmitting}
        >
          <legend className="text-sm font-medium">Empresas (portal cliente)</legend>
          <p className="text-xs text-muted-foreground">
            Solo aplica si el usuario tiene rol Cliente.
          </p>
          <div className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-2">
            {companyOptions.map((company) => (
              <label
                key={company.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  companyIds.includes(company.id)
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:bg-muted/40",
                )}
              >
                <input
                  type="checkbox"
                  checked={companyIds.includes(company.id)}
                  onChange={(event) =>
                    toggleId("companyIds", company.id, event.target.checked)
                  }
                />
                <span>{company.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {!readOnly ? (
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : submitLabel}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
