"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  listAuditLogs,
  type AuditLogItem,
} from "@/components/app/api/audit";
import { listUsers, type UserListItem } from "@/components/app/api/users";
import { DataTable, type DataColumn } from "@/components/app/shared/data-table";
import { hasPermission } from "@/components/app/shared/permissions";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "create", label: "Creación" },
  { value: "read", label: "Lectura" },
  { value: "update", label: "Actualización" },
  { value: "soft_delete", label: "Baja lógica" },
  { value: "assign", label: "Asignación" },
  { value: "unlink", label: "Desvinculación" },
  { value: "status_change", label: "Cambio de estado" },
  { value: "permission_change", label: "Cambio de permisos" },
];

const ACTION_LABELS = new Map(ACTION_OPTIONS.map((o) => [o.value, o.label]));

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function toIsoStart(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toIsoEnd(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatJson(value: Record<string, unknown> | null): string {
  if (!value || Object.keys(value).length === 0) {
    return "—";
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

type LoadState =
  | { status: "loading" }
  | { status: "success"; items: AuditLogItem[]; total: number }
  | { status: "error"; message: string };

export function DashboardActivity() {
  const { claims } = useAuth();
  const canReadUsers = hasPermission(claims, "users:read");

  const [action, setAction] = React.useState<string>(ALL);
  const [userId, setUserId] = React.useState<string>(ALL);
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [state, setState] = React.useState<LoadState>({ status: "loading" });
  const [users, setUsers] = React.useState<UserListItem[]>([]);
  const [selectedLog, setSelectedLog] = React.useState<AuditLogItem | null>(
    null,
  );

  const userNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => {
      map.set(user.id, `${user.firstName} ${user.lastName}`);
    });
    return map;
  }, [users]);

  React.useEffect(() => {
    if (!canReadUsers) {
      return;
    }
    let cancelled = false;
    listUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(() => {
        /* filtro por usuario queda deshabilitado si falla */
      });
    return () => {
      cancelled = true;
    };
  }, [canReadUsers]);

  const load = React.useCallback(async () => {
    setState({ status: "loading" });
    try {
      const result = await listAuditLogs({
        action: action === ALL ? undefined : action,
        userId: userId === ALL ? undefined : userId,
        dateFrom: toIsoStart(dateFrom),
        dateTo: toIsoEnd(dateTo),
        page,
        pageSize,
      });
      setState({
        status: "success",
        items: result.items,
        total: result.total,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cargar la actividad reciente.";
      setState({ status: "error", message });
    }
  }, [action, userId, dateFrom, dateTo, page, pageSize]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resetPageAnd = <T,>(setter: (value: T) => void) => {
    return (value: T) => {
      setPage(1);
      setter(value);
    };
  };

  const resolveUserLabel = React.useCallback(
    (item: AuditLogItem) =>
      item.userId
        ? (userNameById.get(item.userId) ?? item.userId)
        : "Sistema",
    [userNameById],
  );

  const columns = React.useMemo<DataColumn<AuditLogItem>[]>(
    () => [
      {
        key: "createdAt",
        label: "Fecha",
        width: "wide",
        render: (item) => (
          <span className="text-muted-foreground">
            {formatDateTime(item.createdAt)}
          </span>
        ),
      },
      {
        key: "action",
        label: "Acción",
        render: (item) => (
          <Badge variant="secondary">
            {ACTION_LABELS.get(item.action) ?? item.action}
          </Badge>
        ),
      },
      {
        key: "tableName",
        label: "Tabla",
        render: (item) => item.tableName,
      },
      {
        key: "user",
        label: "Usuario",
        width: "wide",
        render: (item) => resolveUserLabel(item),
      },
      {
        key: "actions",
        label: "",
        width: "auto",
        headerClassName: "sr-only",
        render: (item) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Ver detalle del registro"
            title="Ver más"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedLog(item);
            }}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        ),
      },
    ],
    [resolveUserLabel],
  );

  const total = state.status === "success" ? state.total : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Acción</Label>
          <Select
            items={[
              { value: ALL, label: "Todas" },
              ...ACTION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
            value={action}
            onValueChange={resetPageAnd(setAction)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {ACTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Usuario</Label>
          <Select
            items={[
              { value: ALL, label: "Todos" },
              ...users.map((u) => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName}`,
              })),
            ]}
            value={userId}
            onValueChange={resetPageAnd(setUserId)}
            disabled={!canReadUsers || users.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs" htmlFor="audit-date-from">
            Desde
          </Label>
          <Input
            id="audit-date-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => resetPageAnd(setDateFrom)(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs" htmlFor="audit-date-to">
            Hasta
          </Label>
          <Input
            id="audit-date-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => resetPageAnd(setDateTo)(event.target.value)}
          />
        </div>
      </div>

      {state.status === "loading" ? (
        <ListSkeleton columns={columns.length} rows={pageSize > 10 ? 6 : pageSize} />
      ) : state.status === "error" ? (
        <ErrorState message={state.message} onRetry={() => void load()} />
      ) : state.items.length === 0 ? (
        <EmptyState
          title="Sin actividad"
          description="No hay registros de auditoría que coincidan con los filtros."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={state.items}
            getRowKey={(item) => item.id}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filas por página</span>
              <Select
                items={PAGE_SIZE_OPTIONS.map((size) => ({
                  value: String(size),
                  label: String(size),
                }))}
                value={String(pageSize)}
                onValueChange={(value: string) => {
                  setPage(1);
                  setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                {from}–{to} de {total}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft />
                </Button>
                <span className="min-w-16 text-center text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del registro</DialogTitle>
          </DialogHeader>

          {selectedLog ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Fecha">
                  {formatDateTime(selectedLog.createdAt)}
                </DetailField>
                <DetailField label="Acción">
                  <Badge variant="secondary">
                    {ACTION_LABELS.get(selectedLog.action) ?? selectedLog.action}
                  </Badge>
                </DetailField>
                <DetailField label="Tabla">{selectedLog.tableName}</DetailField>
                <DetailField label="Usuario">
                  {resolveUserLabel(selectedLog)}
                </DetailField>
                <DetailField label="ID del registro">
                  <span className="break-all font-mono text-xs">
                    {selectedLog.id}
                  </span>
                </DetailField>
                <DetailField label="ID del recurso">
                  <span className="break-all font-mono text-xs">
                    {selectedLog.recordId ?? "—"}
                  </span>
                </DetailField>
              </div>

              <DetailField label="Valores anteriores">
                <pre className="max-h-56 overflow-auto rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap break-all">
                  {formatJson(selectedLog.oldValues)}
                </pre>
              </DetailField>

              <DetailField label="Valores nuevos">
                <pre className="max-h-56 overflow-auto rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap break-all">
                  {formatJson(selectedLog.newValues)}
                </pre>
              </DetailField>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
