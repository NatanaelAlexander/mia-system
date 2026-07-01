"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
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
import { DataTable, type DataColumn } from "./data-table";
import { EmptyState, ErrorState, ListSkeleton } from "./list-states";
import { canAccessModule } from "./permissions";

type LoadState<T> =
  | { status: "idle"; data: T[] }
  | { status: "loading"; data: T[] }
  | { status: "success"; data: T[] }
  | { status: "error"; data: T[]; message: string };

interface ResourcePageShellProps<T> {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  columns: DataColumn<T>[];
  access: { requiredPermission?: string; internalOnly?: boolean };
  load: () => Promise<T[]>;
}

export function ResourcePageShell<T>({
  title,
  description,
  emptyTitle,
  emptyDescription,
  columns,
  access,
  load,
}: ResourcePageShellProps<T>) {
  const { claims, isLoading } = useAuth();
  const canAccess = canAccessModule(claims, access);
  const [state, setState] = React.useState<LoadState<T>>({
    status: "idle",
    data: [],
  });

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setState({ status: "success", data: [] });
      return;
    }

    setState((current) => ({ status: "loading", data: current.data }));

    try {
      const data = await load();
      setState({ status: "success", data });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Ocurrió un error inesperado al consultar el API.";
      setState({ status: "error", data: [], message });
    }
  }, [claims, canAccess, load]);

  React.useEffect(() => {
    if (!isLoading) {
      void reload();
    }
  }, [isLoading, reload]);

  if (!isLoading && !canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {claims?.surfaces.map((surface) => (
              <Badge key={surface} variant="secondary">
                {surface}
              </Badge>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={state.status === "loading"}
            >
              <RefreshCcw />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {state.status === "loading" || isLoading ? (
          <ListSkeleton columns={columns.length} />
        ) : state.status === "error" ? (
          <ErrorState message={state.message} onRetry={reload} />
        ) : state.data.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <DataTable columns={columns} data={state.data} />
        )}
      </CardContent>
    </Card>
  );
}
