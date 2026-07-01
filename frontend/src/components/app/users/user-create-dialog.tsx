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
import { UserForm, type UserFormValues } from "./user-form";

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const emptyValues: UserFormValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  isActive: true,
  roleIds: [],
  jobTitleIds: [],
  companyIds: [],
};

export function UserCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: UserCreateDialogProps) {
  const router = useRouter();
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
          setRoleOptions(roles);
          setJobTitleOptions(jobTitles);
          setCompanyOptions(companies.map((company) => ({
            id: company.id,
            name: company.name,
          })));
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
  }, [open]);

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
        jobTitleIds: values.jobTitleIds.length > 0 ? values.jobTitleIds : undefined,
        companyIds: values.companyIds.length > 0 ? values.companyIds : undefined,
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
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Crea un usuario interno o cliente portal. Asigna rol y cargos del
            equipo.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        {isLoadingCatalogs ? (
          <p className="text-sm text-muted-foreground">Cargando catálogos...</p>
        ) : (
          <UserForm
            key={open ? "user-create-open" : "user-create-closed"}
            mode="create"
            defaultValues={emptyValues}
            roleOptions={roleOptions}
            jobTitleOptions={jobTitleOptions}
            companyOptions={companyOptions}
            onSubmit={handleSubmit}
            submitLabel="Crear usuario"
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
