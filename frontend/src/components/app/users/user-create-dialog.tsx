"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { listCompanies } from "@/components/app/api/companies";
import {
  createUser,
  listJobTitleCatalog,
  listRoleCatalog,
} from "@/components/app/api/users";
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
import {
  UserForm,
  filterRolesForAudience,
  type UserAudience,
  type UserFormValues,
} from "./user-form";

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  audience: UserAudience;
}

const AUDIENCE_COPY: Record<
  UserAudience,
  { title: string; description: string; submitLabel: string }
> = {
  internal: {
    title: "Nuevo usuario interno",
    description:
      "Crea un usuario del equipo. Asigna rol interno y, si aplica, cargos del equipo.",
    submitLabel: "Crear usuario interno",
  },
  portal: {
    title: "Nuevo usuario portal",
    description:
      "Crea un cliente del portal. Asigna el rol de cliente y las empresas vinculadas.",
    submitLabel: "Crear usuario portal",
  },
};

function emptyValuesForAudience(
  audience: UserAudience,
  roleIds: string[],
): UserFormValues {
  return {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    isActive: true,
    roleIds,
    jobTitleIds: [],
    companyIds: [],
  };
}

export function UserCreateDialog({
  open,
  onOpenChange,
  onCreated,
  audience,
}: UserCreateDialogProps) {
  const router = useRouter();
  const copy = AUDIENCE_COPY[audience];
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [roleOptions, setRoleOptions] = React.useState<
    Awaited<ReturnType<typeof listRoleCatalog>>
  >([]);
  const [jobTitleOptions, setJobTitleOptions] = React.useState<
    Awaited<ReturnType<typeof listJobTitleCatalog>>
  >([]);
  const [companyOptions, setCompanyOptions] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadCatalogs() {
      setIsLoadingCatalogs(true);

      try {
        const [roles, jobTitles, companies] = await Promise.all([
          listRoleCatalog(),
          listJobTitleCatalog(),
          listCompanies("internal", { status: "active" }),
        ]);

        if (!cancelled) {
          setRoleOptions(filterRolesForAudience(roles, audience));
          setJobTitleOptions(jobTitles);
          setCompanyOptions(
            companies.map((company) => ({
              id: company.id,
              name: company.name,
            })),
          );
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError
              ? error.message
              : "No se pudieron cargar los catálogos.";
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCatalogs(false);
        }
      }
    }

    void loadCatalogs();

    return () => {
      cancelled = true;
    };
  }, [audience, open]);

  const defaultRoleIds = React.useMemo(
    () => (roleOptions.length === 1 ? [roleOptions[0].id] : []),
    [roleOptions],
  );

  const handleSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = await createUser({
        email: values.email.trim(),
        password: values.password ?? "",
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phoneNumber: values.phoneNumber?.trim() || undefined,
        isActive: values.isActive,
        roleIds: values.roleIds,
        jobTitleIds:
          audience === "internal" && values.jobTitleIds.length > 0
            ? values.jobTitleIds
            : undefined,
        companyIds:
          audience === "portal" && values.companyIds.length > 0
            ? values.companyIds
            : undefined,
      });

      toast.success("Usuario creado correctamente");
      onOpenChange(false);
      onCreated?.();
      router.push(`/app/users/${user.id}`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el usuario.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        {isLoadingCatalogs ? (
          <p className="text-sm text-muted-foreground">Cargando catálogos...</p>
        ) : roleOptions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            No hay roles disponibles para este tipo de usuario. Revisa el
            catálogo de roles.
          </p>
        ) : (
          <UserForm
            key={`${audience}-${open ? "open" : "closed"}-${defaultRoleIds.join(",")}`}
            mode="create"
            defaultValues={emptyValuesForAudience(audience, defaultRoleIds)}
            roleOptions={roleOptions}
            jobTitleOptions={jobTitleOptions}
            companyOptions={companyOptions}
            onSubmit={handleSubmit}
            submitLabel={copy.submitLabel}
            isSubmitting={isSubmitting}
          />
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
