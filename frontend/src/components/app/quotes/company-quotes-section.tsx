"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderKanban,
  Plus,
  Receipt,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import {
  listQuoteStatusCatalog,
  listQuotes,
  type QuoteDocumentType,
  type QuoteListItem,
  type QuoteStatus,
  type QuoteStatusFlag,
} from "@/components/app/api/quotes";
import { formatDate } from "@/components/app/shared/format";
import { HelpHint } from "@/components/app/shared/help-hint";
import { ListSkeleton } from "@/components/app/shared/list-states";
import { hasPermission } from "@/components/app/shared/permissions";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { companyQuoteHref } from "./quotes-module";

interface CompanyQuotesSectionProps {
  companyId: string;
}

type LifecycleFilter = "all" | QuoteStatus;
type FlagFilter = "all" | string;
type DocFilter = "all" | QuoteDocumentType;
type VisibilityFilter = "all" | "visible" | "private";

const SCOPE_LABEL: Record<string, string> = {
  company: "Empresa",
  project: "Proyecto",
  ticket: "Ticket",
};

const DOC_LABEL: Record<string, string> = {
  boleta: "Boleta",
  factura: "Factura",
};

const STATUS_LABEL: Record<QuoteStatus, string> = {
  ready: "Lista",
  sent: "Enviada",
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDay(value: string | null | undefined): string {
  if (!value) return "—";
  return formatDate(value.includes("T") ? value : `${value}T12:00:00`);
}

function ScopeIcon({ scope }: { scope: string }) {
  if (scope === "project") return <FolderKanban className="size-4" />;
  if (scope === "ticket") return <Ticket className="size-4" />;
  return <Building2 className="size-4" />;
}

function DocIcon({ type }: { type: QuoteDocumentType }) {
  if (type === "factura") return <FileSpreadsheet className="size-4" />;
  return <Receipt className="size-4" />;
}

function lifecycleBadgeClass(status: QuoteStatus): string {
  if (status === "sent") {
    return "border-transparent bg-primary text-primary-foreground";
  }
  return "border-transparent bg-secondary text-secondary-foreground";
}

function flagBadgeClass(category: string): string {
  if (category === "payment") {
    return "border-primary/45 bg-primary/15 text-primary";
  }
  if (category === "workflow") {
    return "border-secondary/50 bg-secondary/20 text-secondary";
  }
  if (category === "exchange") {
    return "border-chart-3/45 bg-chart-3/15 text-chart-3";
  }
  return "border-border/80 bg-muted/80 text-foreground";
}

/** Flags already covered by the lifecycle badge (Enviada). */
function visibleStatusFlags(quote: QuoteListItem) {
  const flags = (quote.statusFlags ?? []).filter((flag) => {
    if (flag.code === "enviado") return false;
    if (flag.category === "exchange") return false;
    return true;
  });
  // Un solo estado comercial visible
  return flags.slice(0, 1);
}

function QuoteRow({
  companyId,
  quote,
}: {
  companyId: string;
  quote: QuoteListItem;
}) {
  const scopeDetail =
    quote.scope === "project" && quote.projectName
      ? quote.projectName
      : quote.scope === "ticket" && quote.ticketTitle
        ? quote.ticketTitle
        : null;

  return (
    <Link
      href={companyQuoteHref(companyId, quote.id)}
      className="group flex items-start gap-3 p-3 transition-colors hover:bg-muted/40 sm:items-center sm:gap-4 sm:p-3.5"
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          quote.documentType === "factura"
            ? "bg-secondary/15 text-secondary"
            : "bg-primary/10 text-primary",
        )}
      >
        <DocIcon type={quote.documentType} />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-medium tracking-tight">
                Cotización #{quote.quoteNumber}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "h-5 gap-1",
                  quote.documentType === "factura"
                    ? "border-secondary/35 bg-secondary/10 text-secondary"
                    : "border-primary/30 bg-primary/10 text-primary",
                )}
              >
                <DocIcon type={quote.documentType} />
                {DOC_LABEL[quote.documentType]}
              </Badge>
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ScopeIcon scope={quote.scope} />
                {SCOPE_LABEL[quote.scope]}
              </span>
              {scopeDetail ? (
                <>
                  <span className="text-border">·</span>
                  <span className="truncate">{scopeDetail}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            {quote.status === "sent" ? (
              <Badge
                variant="outline"
                className={lifecycleBadgeClass(quote.status)}
              >
                {STATUS_LABEL[quote.status]}
              </Badge>
            ) : null}
            <Badge
              variant="outline"
              className={cn(
                "gap-1",
                quote.clientVisible
                  ? "border-secondary/50 bg-secondary/20 text-secondary"
                  : "border-border/80 bg-muted/80 text-foreground",
              )}
            >
              {quote.clientVisible ? (
                <Eye className="size-3" />
              ) : (
                <EyeOff className="size-3" />
              )}
              {quote.clientVisible ? "Visible" : "Privada"}
            </Badge>
            {quote.signedAssetId ? (
              <Badge
                variant="outline"
                className="border-primary/45 bg-primary/15 text-primary"
              >
                Firmado
              </Badge>
            ) : null}
            {visibleStatusFlags(quote).map((flag) => (
              <Badge
                key={flag.code}
                variant="outline"
                className={flagBadgeClass(flag.category)}
              >
                {flag.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-primary/80" />
            <span className="text-foreground/70">Emisión</span>
            {formatDay(quote.issueDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-secondary" />
            <span className="text-foreground/70">Validez</span>
            {formatDay(quote.expiresAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="size-3.5" />
            <span className="text-foreground/70">Actualizada</span>
            {formatDateTime(quote.updatedAt)}
          </span>
          {quote.shareEnabled && quote.shareExpiresAt ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Eye className="size-3.5" />
              Enlace hasta {formatDateTime(quote.shareExpiresAt)}
            </span>
          ) : null}
        </div>
      </div>

      <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:mt-0" />
    </Link>
  );
}

export function CompanyQuotesSection({ companyId }: CompanyQuotesSectionProps) {
  const { claims } = useAuth();
  const canCreate = hasPermission(claims, "quotes:create");
  const [quotes, setQuotes] = React.useState<QuoteListItem[]>([]);
  const [statusCatalog, setStatusCatalog] = React.useState<QuoteStatusFlag[]>(
    [],
  );
  const [isLoading, setIsLoading] = React.useState(true);

  const [lifecycleFilter, setLifecycleFilter] =
    React.useState<LifecycleFilter>("all");
  const [flagFilter, setFlagFilter] = React.useState<FlagFilter>("all");
  const [docFilter, setDocFilter] = React.useState<DocFilter>("all");
  const [visibilityFilter, setVisibilityFilter] =
    React.useState<VisibilityFilter>("all");
  const [issueDateFrom, setIssueDateFrom] = React.useState("");
  const [issueDateTo, setIssueDateTo] = React.useState("");

  React.useEffect(() => {
    void listQuoteStatusCatalog()
      .then(setStatusCatalog)
      .catch(() => setStatusCatalog([]));
  }, []);

  const loadQuotes = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listQuotes({
        companyId,
        status: lifecycleFilter === "all" ? undefined : lifecycleFilter,
        statusCode: flagFilter === "all" ? undefined : flagFilter,
        documentType: docFilter === "all" ? undefined : docFilter,
        clientVisible:
          visibilityFilter === "all"
            ? undefined
            : visibilityFilter === "visible",
        issueDateFrom: issueDateFrom || undefined,
        issueDateTo: issueDateTo || undefined,
      });
      setQuotes(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las cotizaciones.";
      toast.error(message);
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    companyId,
    lifecycleFilter,
    flagFilter,
    docFilter,
    visibilityFilter,
    issueDateFrom,
    issueDateTo,
  ]);

  React.useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadQuotes();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [loadQuotes]);

  const hasActiveFilters =
    lifecycleFilter !== "all" ||
    flagFilter !== "all" ||
    docFilter !== "all" ||
    visibilityFilter !== "all" ||
    !!issueDateFrom ||
    !!issueDateTo;

  const clearFilters = () => {
    setLifecycleFilter("all");
    setFlagFilter("all");
    setDocFilter("all");
    setVisibilityFilter("all");
    setIssueDateFrom("");
    setIssueDateTo("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-primary" />
            Cotizaciones
            <HelpHint
              label="Qué son las cotizaciones"
              text="Documentos comerciales (boleta o factura) asociados a esta empresa, un proyecto o un ticket."
            />
          </CardTitle>
          <CardDescription>
            Filtra por estado, tipo, fechas y visibilidad.
          </CardDescription>
        </div>
        {canCreate ? (
          <Link
            href={companyQuoteHref(companyId)}
            className={cn(
              buttonVariants({ size: "sm" }),
              "shrink-0 self-start",
            )}
          >
            <Plus />
            Nueva cotización
          </Link>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Filter className="size-3.5 text-secondary" />
              Filtros
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                onClick={clearFilters}
              >
                Limpiar
              </button>
            ) : null}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1">
              <Label
                htmlFor="quote-flag-filter"
                className="text-xs text-muted-foreground"
              >
                Estado comercial
              </Label>
              <Select
                items={[
                  { value: "all", label: "Todos los estados" },
                  ...statusCatalog.map((item) => ({
                    value: item.code,
                    label: item.name,
                  })),
                ]}
                value={flagFilter}
                onValueChange={(value: string | null) =>
                  setFlagFilter((value as FlagFilter) ?? "all")
                }
              >
                <SelectTrigger id="quote-flag-filter" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {statusCatalog.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="quote-lifecycle-filter"
                className="text-xs text-muted-foreground"
              >
                Ciclo interno
              </Label>
              <Select
                items={[
                  { value: "all", label: "Todos" },
                  { value: "ready", label: "Lista" },
                  { value: "sent", label: "Enviada" },
                ]}
                value={lifecycleFilter}
                onValueChange={(value: string | null) =>
                  setLifecycleFilter((value as LifecycleFilter) ?? "all")
                }
              >
                <SelectTrigger id="quote-lifecycle-filter" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ready">Lista</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="quote-doc-filter"
                className="text-xs text-muted-foreground"
              >
                Documento
              </Label>
              <Select
                items={[
                  { value: "all", label: "Boleta y factura" },
                  { value: "boleta", label: "Boleta" },
                  { value: "factura", label: "Factura" },
                ]}
                value={docFilter}
                onValueChange={(value: string | null) =>
                  setDocFilter((value as DocFilter) ?? "all")
                }
              >
                <SelectTrigger id="quote-doc-filter" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Boleta y factura</SelectItem>
                  <SelectItem value="boleta">Boleta</SelectItem>
                  <SelectItem value="factura">Factura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="quote-visibility-filter"
                className="text-xs text-muted-foreground"
              >
                Visibilidad
              </Label>
              <Select
                items={[
                  { value: "all", label: "Todas" },
                  { value: "visible", label: "Visible al cliente" },
                  { value: "private", label: "Privadas" },
                ]}
                value={visibilityFilter}
                onValueChange={(value: string | null) =>
                  setVisibilityFilter((value as VisibilityFilter) ?? "all")
                }
              >
                <SelectTrigger id="quote-visibility-filter" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="visible">Visible al cliente</SelectItem>
                  <SelectItem value="private">Privadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="quote-date-from"
                className="text-xs text-muted-foreground"
              >
                Emisión desde
              </Label>
              <Input
                id="quote-date-from"
                type="date"
                className="h-9"
                value={issueDateFrom}
                onChange={(e) => setIssueDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="quote-date-to"
                className="text-xs text-muted-foreground"
              >
                Emisión hasta
              </Label>
              <Input
                id="quote-date-to"
                type="date"
                className="h-9"
                value={issueDateTo}
                onChange={(e) => setIssueDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground">
            {isLoading
              ? "Cargando…"
              : `${quotes.length} cotización${quotes.length === 1 ? "" : "es"}`}
          </p>
        </div>

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : quotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <p className="text-sm font-medium">Sin cotizaciones</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No hay resultados con esos filtros."
                : "Crea la primera cotización para esta empresa."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
            {quotes.map((quote) => (
              <QuoteRow key={quote.id} companyId={companyId} quote={quote} />
            ))}
          </div>
        )}

        {!isLoading && !canCreate ? (
          <p className="text-xs text-muted-foreground">
            Solo el superAdmin puede crear cotizaciones.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Lista compacta reutilizable en proyecto / ticket. */
export function EntityQuotesList({
  companyId,
  projectId,
  ticketId,
  title = "Cotizaciones",
}: {
  companyId: string;
  projectId?: string;
  ticketId?: string;
  title?: string;
}) {
  const [quotes, setQuotes] = React.useState<QuoteListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const data = await listQuotes({ companyId, projectId, ticketId });
        if (!cancelled) setQuotes(data);
      } catch {
        if (!cancelled) setQuotes([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, projectId, ticketId]);

  if (isLoading) {
    return <ListSkeleton rows={2} />;
  }

  if (quotes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay cotizaciones asociadas.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
        {quotes.map((quote) => (
          <Link
            key={quote.id}
            href={companyQuoteHref(companyId, quote.id)}
            className="flex items-center gap-3 p-3 text-sm transition-colors hover:bg-muted/40"
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                quote.documentType === "factura"
                  ? "bg-secondary/15 text-secondary"
                  : "bg-primary/10 text-primary",
              )}
            >
              <DocIcon type={quote.documentType} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                #{quote.quoteNumber} · {DOC_LABEL[quote.documentType]}
              </p>
              <p className="text-xs text-muted-foreground">
                Emisión {formatDay(quote.issueDate)} · Validez{" "}
                {formatDay(quote.expiresAt)}
              </p>
            </div>
            {quote.status === "sent" ? (
              <Badge
                variant="outline"
                className={lifecycleBadgeClass(quote.status)}
              >
                {STATUS_LABEL[quote.status]}
              </Badge>
            ) : null}
          </Link>
        ))}
      </div>
      <Link
        href={companyDetailQuotesHref(companyId)}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Ver en empresa
      </Link>
    </div>
  );
}

function companyDetailQuotesHref(companyId: string): string {
  return `/app/companies/${companyId}?tab=documentos&docs=cotizaciones`;
}
