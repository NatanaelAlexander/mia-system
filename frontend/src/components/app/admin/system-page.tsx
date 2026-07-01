"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import {
  verifyAuthorizationHealth,
  type AuthorizationHealthReport,
} from "@/components/app/api/authorization";
import { ApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import { canAccessModule } from "@/components/app/shared/permissions";
import { systemModule } from "./system-module";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function SystemPage() {
  const { claims, isLoading } = useAuth();
  const canAccess = canAccessModule(claims, systemModule);
  const [report, setReport] = React.useState<AuthorizationHealthReport | null>(
    null,
  );
  const [isFetching, setIsFetching] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setReport(null);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    setErrorMessage(null);

    try {
      const data = await verifyAuthorizationHealth();
      setReport(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo verificar el estado de autorización.";
      setErrorMessage(message);
      setReport(null);
    } finally {
      setIsFetching(false);
    }
  }, [canAccess, claims]);

  React.useEffect(() => {
    if (!isLoading) {
      void reload();
    }
  }, [isLoading, reload]);

  if (!isLoading && !canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sistema</CardTitle>
          <CardDescription>
            Herramientas operativas de autorización y configuración.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorState
            message="Tu usuario no tiene permiso para ver este módulo."
            onRetry={reload}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Sistema</CardTitle>
            <CardDescription>
              Salud de roles, permisos y usuarios sin autorización efectiva.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {report ? (
              <Badge variant={report.healthy ? "secondary" : "destructive"}>
                {report.healthy ? "Saludable" : "Con advertencias"}
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={isFetching}
            >
              <RefreshCcw />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {isFetching || isLoading ? (
          <ListSkeleton columns={3} rows={2} />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={reload} />
        ) : report ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Roles" value={report.roles} />
              <StatCard label="Permisos" value={report.permissions} />
              <StatCard
                label="Permisos rol admin"
                value={report.adminRolePermissionCount}
              />
              <StatCard
                label="Permisos rol super_admin"
                value={report.superAdminRolePermissionCount}
              />
              <StatCard
                label="Usuarios sin rol"
                value={report.usersWithoutRoles}
              />
              <StatCard
                label="Usuarios sin permisos"
                value={report.usersWithoutPermissions}
              />
            </div>

            {report.warnings.length > 0 ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive">
                  Advertencias
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay advertencias en la configuración de autorización.
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
