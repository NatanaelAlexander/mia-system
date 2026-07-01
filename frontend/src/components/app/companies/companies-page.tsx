"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import {
  listCompanies,
  type CompanyListItem,
} from "@/components/app/api/companies";
import { formatCompanyStatus } from "@/components/app/shared/format";
import {
  canAccessModule,
  hasPermission,
  isInternalUser,
} from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import { useAuth } from "@/hooks/use-auth";
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
import { CompanyCreateDialog } from "./company-create-dialog";
import { companiesModule } from "./companies-module";

type LoadState =
  | { status: "loading"; data: CompanyListItem[] }
  | { status: "success"; data: CompanyListItem[] }
  | { status: "error"; message: string; data: CompanyListItem[] };

export function CompaniesPage() {
  const router = useRouter();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const canAccess = canAccessModule(claims, companiesModule);
  const canCreate =
    isInternalUser(claims) && hasPermission(claims, "companies:create");

  const [state, setState] = React.useState<LoadState>({
    status: "loading",
    data: [],
  });
  const [createOpen, setCreateOpen] = React.useState(false);

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setState({ status: "success", data: [] });
      return;
    }

    setState((current) => ({ status: "loading", data: current.data }));

    try {
      const data = await listCompanies(surface);
      setState({ status: "success", data });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las empresas.";
      setState({ status: "error", message, data: [] });
    }
  }, [claims, canAccess, surface]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void reload();
    }
  }, [isAuthLoading, reload]);

  const columns = React.useMemo<DataColumn<CompanyListItem>[]>(
    () => [
      {
        key: "name",
        label: "Empresa",
        render: (item) => (
          <Link
            href={`/app/companies/${item.id}`}
            className="font-medium text-primary hover:underline"
          >
            {item.name}
          </Link>
        ),
      },
      { key: "taxId", label: "RUT", render: (item) => item.taxId },
      {
        key: "status",
        label: "Estado",
        render: (item) => (
          <Badge variant={item.status === "active" ? "secondary" : "outline"}>
            {formatCompanyStatus(item.status)}
          </Badge>
        ),
      },
      { key: "email", label: "Email", render: (item) => item.email ?? "—" },
      {
        key: "phone",
        label: "Teléfono",
        render: (item) => item.phoneNumber ?? "—",
      },
    ],
    [],
  );

  if (!isAuthLoading && !canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
          <CardDescription>Empresas activas según tu superficie de acceso.</CardDescription>
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
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Empresas</CardTitle>
              <CardDescription>
                Gestiona empresas, usuarios vinculados y su operación.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {claims?.surfaces.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
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
              {canCreate ? (
                <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus />
                  Nueva empresa
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isAuthLoading || state.status === "loading" ? (
            <ListSkeleton columns={5} />
          ) : state.status === "error" ? (
            <ErrorState message={state.message} onRetry={reload} />
          ) : state.data.length === 0 ? (
            <EmptyState
              title="No hay empresas"
              description={
                canCreate
                  ? "Crea la primera empresa para comenzar a vincular usuarios y proyectos."
                  : "Aún no hay empresas disponibles para este usuario."
              }
            />
          ) : (
            <div
              className="overflow-hidden rounded-xl border border-border/70"
              onClick={(event) => {
                const row = (event.target as HTMLElement).closest("[data-company-id]");
                const companyId = row?.getAttribute("data-company-id");
                if (companyId && event.target instanceof HTMLElement && !event.target.closest("a")) {
                  router.push(`/app/companies/${companyId}`);
                }
              }}
            >
              <div
                className="grid gap-3 border-b bg-muted/40 p-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
              >
                {columns.map((column) => (
                  <div key={column.key}>{column.label}</div>
                ))}
              </div>
              <div className="divide-y divide-border/70">
                {state.data.map((item) => (
                  <div
                    key={item.id}
                    data-company-id={item.id}
                    className="grid cursor-pointer gap-3 p-3 text-sm hover:bg-muted/30"
                    style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
                  >
                    {columns.map((column) => (
                      <div key={column.key} className="min-w-0 truncate">
                        {column.render(item)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={reload}
      />
    </>
  );
}
