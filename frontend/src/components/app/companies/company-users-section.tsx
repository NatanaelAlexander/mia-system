"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserPlus, UserMinus } from "lucide-react";
import {
  assignUserToCompany,
  unassignUserFromCompany,
} from "@/components/app/api/companies";
import { listUsers, type UserListItem } from "@/components/app/api/users";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListSkeleton } from "@/components/app/shared/list-states";
import { ConfirmDialog } from "@/components/app/shared/confirm-dialog";

interface CompanyUsersSectionProps {
  companyId: string;
  canManage: boolean;
}

export function CompanyUsersSection({
  companyId,
  canManage,
}: CompanyUsersSectionProps) {
  const [linkedUsers, setLinkedUsers] = React.useState<UserListItem[]>([]);
  const [availableUsers, setAvailableUsers] = React.useState<UserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [unassignTarget, setUnassignTarget] = React.useState<UserListItem | null>(
    null,
  );

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const [linked, allActive] = await Promise.all([
        listUsers({ companyId }),
        listUsers({ isActive: true }),
      ]);

      setLinkedUsers(linked);
      setAvailableUsers(
        allActive.filter((user) => !linked.some((linkedUser) => linkedUser.id === user.id)),
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los usuarios.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleAssign = async () => {
    if (!selectedUserId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await assignUserToCompany(companyId, selectedUserId);
      toast.success("Usuario asignado a la empresa");
      setSelectedUserId("");
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo asignar el usuario.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    if (!unassignTarget) {
      return;
    }

    setIsSubmitting(true);

    try {
      await unassignUserFromCompany(companyId, unassignTarget.id);
      toast.success("Usuario desasignado");
      setUnassignTarget(null);
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo desasignar el usuario.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unassignTargetName = unassignTarget
    ? `${unassignTarget.firstName} ${unassignTarget.lastName}`.trim()
    : "este usuario";

  const userSelectItems = React.useMemo(() => {
    const placeholder =
      availableUsers.length === 0
        ? "No hay usuarios disponibles"
        : "Selecciona un usuario";

    return [
      { label: placeholder, value: null },
      ...availableUsers.map((user) => ({
        label: `${user.firstName} ${user.lastName} (${user.email})`,
        value: user.id,
      })),
    ];
  }, [availableUsers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios vinculados</CardTitle>
        <CardDescription>
          {canManage
            ? "Asigna o desasigna usuarios del portal que operan con esta empresa."
            : "Usuarios del portal que pueden operar con esta empresa."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManage ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              items={userSelectItems}
              value={selectedUserId || null}
              onValueChange={(value) =>
                setSelectedUserId(typeof value === "string" ? value : "")
              }
              disabled={isSubmitting || availableUsers.length === 0}
            >
              <SelectTrigger className="min-w-0 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userSelectItems.map((item) =>
                  item.value === null ? null : (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={!selectedUserId || isSubmitting}
            >
              <UserPlus />
              Asignar
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <ListSkeleton columns={3} rows={3} />
        ) : linkedUsers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Esta empresa aún no tiene usuarios asignados.
          </p>
        ) : (
          <div className="divide-y divide-border/70 rounded-xl border border-border/70">
            {linkedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-muted-foreground">{user.email}</p>
                </div>
                {canManage ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setUnassignTarget(user)}
                  >
                    <UserMinus />
                    Desasignar
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={unassignTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUnassignTarget(null);
          }
        }}
        title="Desasignar usuario"
        description={`¿Desasignar a ${unassignTargetName} de esta empresa? El usuario seguirá existiendo, pero dejará de operar con esta empresa.`}
        confirmLabel="Desasignar"
        onConfirm={handleUnassign}
        isConfirming={isSubmitting}
      />
    </Card>
  );
}
