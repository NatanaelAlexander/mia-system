"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listCompanies } from "@/components/app/api/companies";
import {
  adminChangeUserPassword,
  assignUserRoles,
  deactivateUser,
  getUserDetail,
  linkUserToCompany,
  listJobTitleCatalog,
  listRoleCatalog,
  unlinkUserFromCompany,
  updateUser,
  type UserDetail,
} from "@/components/app/api/users";
import { formatRoles } from "@/components/app/shared/format";
import { ErrorState } from "@/components/app/shared/list-states";
import {
  canAccessModule,
  hasPermission,
} from "@/components/app/shared/permissions";
import { ConfirmDialog } from "@/components/app/shared/confirm-dialog";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usersModule } from "./users-module";
import {
  toUserFormValues,
  UserForm,
  type UserFormSubmitMeta,
  type UserFormValues,
} from "./user-form";

interface UserDetailPageProps {
  userId: string;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

export function UserDetailPage({ userId }: UserDetailPageProps) {
  const router = useRouter();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const canAccess = canAccessModule(claims, usersModule);
  const canUpdate = hasPermission(claims, "users:update");
  const canAssignRoles = hasPermission(claims, "users:assign_roles");
  const canDeactivate = hasPermission(claims, "users:delete");

  const [user, setUser] = React.useState<UserDetail | null>(null);
  const [roleOptions, setRoleOptions] = React.useState<
    Awaited<ReturnType<typeof listRoleCatalog>>
  >([]);
  const [jobTitleOptions, setJobTitleOptions] = React.useState<
    Awaited<ReturnType<typeof listJobTitleCatalog>>
  >([]);
  const [companyOptions, setCompanyOptions] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);

  const loadUser = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [detail, roles, jobTitles, companies] = await Promise.all([
        getUserDetail(userId),
        listRoleCatalog(),
        listJobTitleCatalog(),
        listCompanies("internal", { status: "active" }),
      ]);

      setUser(detail);
      setRoleOptions(roles);
      setJobTitleOptions(jobTitles);
      setCompanyOptions(companies.map((company) => ({
        id: company.id,
        name: company.name,
      })));
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cargar el usuario.";
      setErrorMessage(message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, claims, userId]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void loadUser();
    }
  }, [isAuthLoading, loadUser]);

  const handleSubmit = async (
    values: UserFormValues,
    { dirtyFields }: UserFormSubmitMeta,
  ) => {
    if (!user || (!canUpdate && !canAssignRoles)) {
      return;
    }

    setIsSubmitting(true);

    try {
      let updated = user;

      const profileDirty =
        dirtyFields.email ||
        dirtyFields.firstName ||
        dirtyFields.lastName ||
        dirtyFields.phoneNumber ||
        dirtyFields.isActive ||
        dirtyFields.jobTitleIds;

      if (canUpdate && profileDirty) {
        updated = await updateUser(userId, {
          email: values.email.trim(),
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          phoneNumber: values.phoneNumber?.trim() || null,
          isActive: values.isActive,
          jobTitleIds: values.jobTitleIds,
        });
      }

      if (canAssignRoles && dirtyFields.roleIds) {
        updated = await assignUserRoles(userId, values.roleIds);
      }

      if (canUpdate && dirtyFields.companyIds) {
        const previousCompanyIds = user.companies.map((company) => company.id);
        const toLink = values.companyIds.filter(
          (companyId) => !previousCompanyIds.includes(companyId),
        );
        const toUnlink = previousCompanyIds.filter(
          (companyId) => !values.companyIds.includes(companyId),
        );

        for (const companyId of toLink) {
          updated = await linkUserToCompany(userId, companyId);
        }

        for (const companyId of toUnlink) {
          updated = await unlinkUserFromCompany(userId, companyId);
        }
      }

      if (
        !profileDirty &&
        !dirtyFields.roleIds &&
        !dirtyFields.companyIds
      ) {
        toast.message("No hay cambios por guardar");
        return;
      }

      setUser(updated);
      toast.success("Usuario actualizado");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron guardar los cambios.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!canDeactivate || !user) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deactivateUser(userId);
      toast.success("Usuario desactivado");
      setDeactivateConfirmOpen(false);
      router.push("/app/users");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo desactivar el usuario.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canUpdate || newPassword.trim().length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsResettingPassword(true);

    try {
      await adminChangeUserPassword(userId, newPassword.trim());
      setNewPassword("");
      toast.success("Contraseña actualizada");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar la contraseña.";
      toast.error(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return <DetailSkeleton />;
  }

  if (!canAccess || errorMessage || !user) {
    return (
      <div className="space-y-4">
        <Link href="/app/users" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft />
          Volver a usuarios
        </Link>
        <ErrorState
          message={errorMessage ?? "No se pudo cargar el usuario."}
          onRetry={loadUser}
        />
      </div>
    );
  }

  const canEdit = canUpdate || canAssignRoles;
  const formValues = toUserFormValues(user);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/app/users" className={buttonVariants({ variant: "outline", size: "sm" })}>
        <ArrowLeft />
        Volver a usuarios
      </Link>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle>Datos del usuario</CardTitle>
              <CardDescription>
                Roles: {formatRoles(user.roles)}
                {user.jobTitles.length > 0
                  ? ` · Cargos: ${user.jobTitles.join(", ")}`
                  : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={user.isActive ? "secondary" : "outline"}>
                {user.isActive ? "Activo" : "Inactivo"}
              </Badge>
              {canDeactivate && user.isActive ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeactivateConfirmOpen(true)}
                  disabled={isSubmitting}
                >
                  <Trash2 />
                  Desactivar
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <UserForm
            key={`${user.id}-${user.permissionsVersion}`}
            mode="edit"
            defaultValues={formValues}
            roleOptions={roleOptions}
            jobTitleOptions={jobTitleOptions}
            companyOptions={companyOptions}
            onSubmit={handleSubmit}
            submitLabel="Guardar cambios"
            readOnly={!canEdit}
            isSubmitting={isSubmitting}
            canEditRoles={canAssignRoles}
            canEditJobTitles={canUpdate}
            canEditCompanies={canUpdate}
          />
        </CardContent>
      </Card>

      {canUpdate ? (
        <Card>
          <CardHeader>
            <CardTitle>Restablecer contraseña</CardTitle>
            <CardDescription>
              Define una contraseña temporal. El usuario deberá cambiarla al
              iniciar sesión si lo exiges por política interna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleResetPassword}>
              <div className="flex-1 space-y-2">
                <Label htmlFor="admin-new-password">Nueva contraseña</Label>
                <Input
                  id="admin-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  disabled={isResettingPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={isResettingPassword || newPassword.length < 6}>
                {isResettingPassword ? "Guardando..." : "Actualizar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={deactivateConfirmOpen}
        onOpenChange={setDeactivateConfirmOpen}
        title="Desactivar usuario"
        description={`¿Desactivar a ${user.firstName} ${user.lastName}? No podrá iniciar sesión.`}
        confirmLabel="Desactivar"
        isConfirming={isSubmitting}
        onConfirm={() => void handleDeactivate()}
      />
    </div>
  );
}
