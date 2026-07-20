"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Filter,
  IdCard,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import {
  listCompanies,
  type CompanyListItem,
  type CompanyStatus,
} from "@/components/app/api/companies";
import { formatCompanyStatus } from "@/components/app/shared/format";
import { HelpHint } from "@/components/app/shared/help-hint";
import {
  canAccessModule,
  hasPermission,
  isInternalUser,
  isSuperAdmin,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type DataColumn } from "@/components/app/shared/data-table";
import { CompanyCreateDialog } from "./company-create-dialog";
import { companiesModule } from "./companies-module";

const SURFACE_HELP: Record<string, string> = {
  internal:
    "Acceso interno del equipo: gestión completa de empresas, proyectos, tickets y usuarios.",
  portal:
    "Acceso portal del cliente: ve solo las empresas vinculadas a tu cuenta y su operación permitida.",
};

const STATUS_HELP: Record<CompanyStatus, string> = {
  active:
    "Empresa operativa. Puede tener proyectos activos, usuarios vinculados y tickets en curso.",
  inactive:
    "Empresa deshabilitada. No se usa en la operación diaria; se mantiene el historial.",
};

type StatusFilter = "all" | CompanyStatus;

type LoadState =
  | { status: "loading"; data: CompanyListItem[] }
  | { status: "success"; data: CompanyListItem[] }
  | { status: "error"; message: string; data: CompanyListItem[] };

const statusFilterItems = [
  { label: "Todas", value: "all" as const },
  { label: "Activas", value: "active" as const },
  { label: "Inactivas", value: "inactive" as const },
];

function filterPortalCompanies(
  data: CompanyListItem[],
  search: string,
  statusFilter: StatusFilter,
) {
  const term = search.trim().toLowerCase();
  const normalizedTerm = term.replace(/[.\-]/g, "");

  return data.filter((company) => {
    if (statusFilter !== "all" && company.status !== statusFilter) {
      return false;
    }

    if (!term) {
      return true;
    }

    const normalizedTaxId = company.taxId.replace(/[.\-]/g, "").toLowerCase();

    return (
      company.name.toLowerCase().includes(term) ||
      company.taxId.toLowerCase().includes(term) ||
      normalizedTaxId.includes(normalizedTerm)
    );
  });
}

export function CompaniesPage() {
  const router = useRouter();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const isInternal = isInternalUser(claims);
  const canAccess = canAccessModule(claims, companiesModule);
  const canCreate =
    isInternalUser(claims) &&
    isSuperAdmin(claims) &&
    hasPermission(claims, "companies:create");

  const [state, setState] = React.useState<LoadState>({
    status: "loading",
    data: [],
  });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const apiFilters = React.useMemo(() => {
    if (!isInternal) {
      return {};
    }

    return {
      status: statusFilter === "all" ? undefined : statusFilter,
      search: debouncedSearch || undefined,
    };
  }, [debouncedSearch, isInternal, statusFilter]);

  const reload = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setState({ status: "success", data: [] });
      return;
    }

    setState((current) => ({ status: "loading", data: current.data }));

    try {
      const data = await listCompanies(surface, apiFilters);
      setState({ status: "success", data });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las empresas.";
      setState({ status: "error", message, data: [] });
    }
  }, [apiFilters, claims, canAccess, surface]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void reload();
    }
  }, [isAuthLoading, reload]);

  const visibleData = React.useMemo(() => {
    if (isInternal) {
      return state.data;
    }

    return filterPortalCompanies(state.data, debouncedSearch, statusFilter);
  }, [debouncedSearch, isInternal, state.data, statusFilter]);

  const columns = React.useMemo<DataColumn<CompanyListItem>[]>(
    () => [
      {
        key: "name",
        label: "Empresa",
        render: (item) => (
          <Link
            href={`/app/companies/${item.id}`}
            className="inline-flex max-w-full items-center gap-2 font-medium text-primary hover:underline"
          >
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.name}</span>
          </Link>
        ),
      },
      {
        key: "taxId",
        label: "RUT",
        render: (item) => (
          <span className="inline-flex max-w-full items-center gap-2">
            <IdCard className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.taxId}</span>
          </span>
        ),
      },
      {
        key: "status",
        label: "Estado",
        render: (item) => (
          <span className="inline-flex items-center gap-1.5">
            <Badge variant={item.status === "active" ? "secondary" : "outline"}>
              {formatCompanyStatus(item.status)}
            </Badge>
            <HelpHint
              label={`Qué significa ${formatCompanyStatus(item.status)}`}
              text={STATUS_HELP[item.status]}
            />
          </span>
        ),
      },
      {
        key: "email",
        label: "Email",
        render: (item) => (
          <span className="inline-flex max-w-full items-center gap-2">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.email ?? "—"}</span>
          </span>
        ),
      },
      {
        key: "phone",
        label: "Teléfono",
        render: (item) => (
          <span className="inline-flex max-w-full items-center gap-2">
            <Phone className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.phoneNumber ?? "—"}</span>
          </span>
        ),
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
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Empresas
              </CardTitle>
              <CardDescription>
                Gestiona empresas, usuarios vinculados y su operación.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {claims?.surfaces.map((item) => (
                <span key={item} className="inline-flex items-center gap-1">
                  <Badge variant="secondary">{item}</Badge>
                  <HelpHint
                    label={`Qué es ${item}`}
                    text={
                      SURFACE_HELP[item] ??
                      "Superficie de acceso asignada a tu usuario."
                    }
                  />
                </span>
              ))}
              {canCreate ? (
                <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus />
                  Nueva empresa
                </Button>
              ) : null}
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

        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="company-search" className="text-base font-medium">
                Buscar por nombre o RUT
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="company-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ej: Empresa Demo o 12.345.678-5"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="company-status-filter"
                className="inline-flex items-center gap-1.5"
              >
                <Filter className="size-3.5 text-muted-foreground" />
                Estado
                <HelpHint
                  label="Qué significa el filtro de estado"
                  text="Activa: empresa operativa. Inactiva: empresa deshabilitada. Todas: muestra ambos estados."
                />
              </Label>
              <Select
                items={statusFilterItems}
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter((value as StatusFilter | null) ?? "all")
                }
              >
                <SelectTrigger id="company-status-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAuthLoading || state.status === "loading" ? (
            <ListSkeleton columns={5} />
          ) : state.status === "error" ? (
            <ErrorState message={state.message} onRetry={reload} />
          ) : visibleData.length === 0 ? (
            <EmptyState
              title="No hay empresas"
              description={
                search || statusFilter !== "active"
                  ? "No se encontraron empresas con los filtros seleccionados."
                  : canCreate
                    ? "Crea la primera empresa para comenzar a vincular usuarios y proyectos."
                    : "Aún no hay empresas disponibles para este usuario."
              }
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {visibleData.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded-xl border border-border/70 p-3 text-left transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/app/companies/${item.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {item.taxId}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === "active" ? "secondary" : "outline"
                        }
                      >
                        {formatCompanyStatus(item.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="size-3.5 shrink-0" />
                        <span className="truncate">{item.email ?? "—"}</span>
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <Phone className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {item.phoneNumber ?? "—"}
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div
                className="hidden overflow-x-auto rounded-xl border border-border/70 md:block"
                onClick={(event) => {
                  const row = (event.target as HTMLElement).closest(
                    "[data-company-id]",
                  );
                  const companyId = row?.getAttribute("data-company-id");
                  if (
                    companyId &&
                    event.target instanceof HTMLElement &&
                    !event.target.closest("a")
                  ) {
                    router.push(`/app/companies/${companyId}`);
                  }
                }}
              >
                <div style={{ minWidth: 720 }}>
                  <div
                    className="grid gap-3 border-b bg-muted/40 p-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    style={{
                      gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))`,
                    }}
                  >
                    {columns.map((column) => (
                      <div
                        key={column.key}
                        className="inline-flex items-center gap-1.5"
                      >
                        {column.key === "name" ? (
                          <Building2 className="size-3.5" />
                        ) : null}
                        {column.key === "taxId" ? (
                          <IdCard className="size-3.5" />
                        ) : null}
                        {column.key === "status" ? (
                          <Filter className="size-3.5" />
                        ) : null}
                        {column.key === "email" ? (
                          <Mail className="size-3.5" />
                        ) : null}
                        {column.key === "phone" ? (
                          <Phone className="size-3.5" />
                        ) : null}
                        {column.label}
                      </div>
                    ))}
                  </div>
                  <div className="divide-y divide-border/70">
                    {visibleData.map((item) => (
                      <div
                        key={item.id}
                        data-company-id={item.id}
                        className="grid cursor-pointer gap-3 p-3 text-sm hover:bg-muted/30"
                        style={{
                          gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))`,
                        }}
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
              </div>
            </>
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
