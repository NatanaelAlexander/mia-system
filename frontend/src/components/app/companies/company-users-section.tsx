"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserPlus, UserMinus } from "lucide-react";
import {
  linkUserToCompany,
  listUsers,
  unlinkUserFromCompany,
  type UserListItem,
} from "@/components/app/api/users";
import { hasPermission } from "@/components/app/shared/permissions";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ListSkeleton } from "@/components/app/shared/list-states";

interface CompanyUsersSectionProps {
  companyId: string;
}

export function CompanyUsersSection({ companyId }: CompanyUsersSectionProps) {
  const { claims } = useAuth();
  const canManageUsers = hasPermission(claims, "users:update");

  const [linkedUsers, setLinkedUsers] = React.useState<UserListItem[]>([]);
  const [availableUsers, setAvailableUsers] = React.useState<UserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const handleLink = async () => {
    if (!selectedUserId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await linkUserToCompany(selectedUserId, companyId);
      toast.success("Usuario vinculado a la empresa");
      setSelectedUserId("");
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo vincular el usuario.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async (userId: string) => {
    setIsSubmitting(true);

    try {
      await unlinkUserFromCompany(userId, companyId);
      toast.success("Usuario desvinculado");
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo desvincular el usuario.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios vinculados</CardTitle>
        <CardDescription>
          Usuarios del portal que pueden operar con esta empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManageUsers ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              disabled={isSubmitting || availableUsers.length === 0}
              className="flex h-8 min-w-0 flex-1 rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">
                {availableUsers.length === 0
                  ? "No hay usuarios disponibles"
                  : "Selecciona un usuario"}
              </option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={handleLink}
              disabled={!selectedUserId || isSubmitting}
            >
              <UserPlus />
              Vincular
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <ListSkeleton columns={3} rows={3} />
        ) : linkedUsers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Esta empresa aún no tiene usuarios vinculados.
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
                {canManageUsers ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleUnlink(user.id)}
                  >
                    <UserMinus />
                    Quitar
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
