"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookmarkPlus,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  Copy,
  Download,
  FileSignature,
  FileText,
  FolderKanban,
  FolderOpen,
  Link2,
  Link2Off,
  ListOrdered,
  Palette,
  Plus,
  Receipt,
  RefreshCw,
  Settings2,
  Ticket,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/shared/confirm-dialog";
import {
  createQuote,
  createQuotePreset,
  deleteQuote,
  deleteQuotePreset,
  getQuoteDetail,
  listQuoteIssuers,
  listQuotePresets,
  listQuoteStatusCatalog,
  removeQuoteSignedDocument,
  sendQuote,
  setQuoteStatus,
  toggleQuoteShare,
  updateQuote,
  updateQuotePreset,
  uploadQuoteSignedDocument,
  type CreateQuotePayload,
  type PriceInputMode,
  type QuoteDetail,
  type QuoteDocumentType,
  type QuoteFrequency,
  type QuoteIssuer,
  type QuotePreset,
  type QuotePresetPayload,
  type QuoteScope,
  type QuoteSectionPayload,
  type QuoteStatusFlag,
} from "@/components/app/api/quotes";
import { getAssetDownloadUrl } from "@/components/app/api/assets";
import { listProjects } from "@/components/app/api/projects";
import { listTickets } from "@/components/app/api/tickets";
import { getCompanyDetail } from "@/components/app/api/companies";
import { companyDetailHref } from "@/components/app/companies/companies-module";
import { ErrorState, ListSkeleton } from "@/components/app/shared/list-states";
import { HelpHint } from "@/components/app/shared/help-hint";
import {
  canAccessModule,
  hasPermission,
} from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { generateQuotePdf } from "./quote-pdf";
import {
  DEFAULT_QUOTE_PDF_LAYOUT_ID,
  DEFAULT_QUOTE_PDF_PRIMARY,
  DEFAULT_QUOTE_PDF_SECONDARY,
  getQuotePdfLayout,
  isHexColor,
  isQuotePdfLayoutId,
  QUOTE_PDF_BACKGROUND,
  QUOTE_PDF_LAYOUTS,
  QUOTE_PDF_PRIMARY_COLORS,
  QUOTE_PDF_SECONDARY_COLORS,
  resolveQuotePdfTheme,
  type QuotePdfLayoutId,
} from "./quote-pdf-styles";
import {
  QuotePreviewDocument,
  type QuotePreviewModel,
} from "./quote-preview";
import { publicQuoteHref, quotesModule } from "./quotes-module";
import {
  calculateSectionTotals,
  formatClp,
  RETENTION_RATE_2026,
} from "./quotes-tax";

interface QuoteEditorPageProps {
  companyId: string;
  quoteId?: string;
}

type QuoteEditorTab = "datos" | "pagos" | "gestion";
type GestionStep = "enlace" | "estados" | "firmado";

const GESTION_STEPS: Array<{
  id: GestionStep;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  card: string;
  iconWrap: string;
  accentText: string;
}> = [
  {
    id: "enlace",
    label: "Enlace",
    description: "Revisión pública",
    Icon: Link2,
    card: "border-secondary/40 bg-secondary/10 ring-secondary/25",
    iconWrap: "bg-secondary text-secondary-foreground",
    accentText: "text-secondary",
  },
  {
    id: "estados",
    label: "Estado",
    description: "Estado único",
    Icon: ListOrdered,
    card: "border-primary/35 bg-primary/5 ring-primary/20",
    iconWrap: "bg-primary text-primary-foreground",
    accentText: "text-primary",
  },
  {
    id: "firmado",
    label: "Firmado",
    description: "Documento",
    Icon: FileSignature,
    card: "border-chart-3/50 bg-chart-3/10 ring-chart-3/30",
    iconWrap: "bg-chart-3 text-zinc-950",
    accentText: "text-chart-3",
  },
];

function TabLabel({
  icon: Icon,
  label,
  shortLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 shrink-0" />
      <span className="sm:hidden">{shortLabel}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

interface DraftItem {
  key: string;
  title: string;
  description: string;
  price: string;
}

interface DraftSection {
  frequency: QuoteFrequency;
  esCanje: boolean;
  applyTax: boolean;
  priceInputMode: PriceInputMode;
  items: DraftItem[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function emptySections(): DraftSection[] {
  return [
    {
      frequency: "unico",
      esCanje: false,
      applyTax: false,
      priceInputMode: "gross",
      items: [],
    },
    {
      frequency: "mensual",
      esCanje: false,
      applyTax: false,
      priceInputMode: "gross",
      items: [],
    },
    {
      frequency: "anual",
      esCanje: false,
      applyTax: false,
      priceInputMode: "gross",
      items: [],
    },
  ];
}

function sectionsFromQuote(quote: QuoteDetail): DraftSection[] {
  const base = emptySections();
  for (const section of quote.sections) {
    const target = base.find((s) => s.frequency === section.frequency);
    if (!target) continue;
    target.esCanje = section.esCanje;
    target.applyTax = section.applyTax;
    target.priceInputMode = section.priceInputMode ?? "gross";
    target.items = section.items.map((item, index) => ({
      key: item.id ?? `${section.frequency}-${index}`,
      title: item.title,
      description: item.description,
      price: String(item.price),
    }));
  }
  return base;
}

const FREQUENCY_TITLE: Record<QuoteFrequency, string> = {
  unico: "Pagos únicos",
  mensual: "Pagos mensuales",
  anual: "Pagos anuales",
};

const FREQUENCY_SHORT: Record<QuoteFrequency, string> = {
  unico: "Único",
  mensual: "Mensual",
  anual: "Anual",
};

const FREQUENCY_ORDER: QuoteFrequency[] = ["unico", "mensual", "anual"];

function initialActiveFrequency(sections: DraftSection[]): QuoteFrequency {
  return (
    FREQUENCY_ORDER.find((frequency) => {
      const section = sections.find((row) => row.frequency === frequency);
      if (!section) return false;
      return (
        section.items.length > 0 || section.esCanje || section.applyTax
      );
    }) ?? "unico"
  );
}

const FREQUENCY_THEME: Record<
  QuoteFrequency,
  {
    card: string;
    iconWrap: string;
    accentText: string;
    addVariant: "default" | "secondary";
    addClassName?: string;
    totals: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  unico: {
    card: "border-primary/35 bg-primary/5 ring-primary/20",
    iconWrap: "bg-primary text-primary-foreground",
    accentText: "text-primary",
    addVariant: "default",
    totals: "border-primary/25 bg-primary/10",
    Icon: Receipt,
  },
  mensual: {
    card: "border-secondary/40 bg-secondary/10 ring-secondary/25",
    iconWrap: "bg-secondary text-secondary-foreground",
    accentText: "text-secondary",
    addVariant: "secondary",
    totals: "border-secondary/30 bg-secondary/15",
    Icon: CalendarClock,
  },
  anual: {
    card: "border-chart-3/50 bg-chart-3/10 ring-chart-3/30",
    iconWrap: "bg-chart-3 text-zinc-950",
    accentText: "text-chart-3",
    addVariant: "default",
    addClassName:
      "border-transparent bg-chart-3 text-zinc-950 hover:bg-chart-3/85 hover:text-zinc-950",
    totals: "border-chart-3/35 bg-chart-3/15",
    Icon: RefreshCw,
  },
};

function OptionChip({
  id,
  checked,
  onCheckedChange,
  label,
  tone = "primary",
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
        checked
          ? tone === "primary"
            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            : "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground"
          : "border-border/70 bg-muted/40 text-foreground hover:border-primary/40 hover:bg-primary/15 hover:text-primary",
      )}
    >
      <input
        id={id}
        type="checkbox"
        className={cn(
          "size-3.5 rounded border-border accent-primary",
          tone === "secondary" && "accent-secondary",
        )}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function QuoteEditorPage({ companyId, quoteId }: QuoteEditorPageProps) {
  const router = useRouter();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "internal";
  const canAccess = canAccessModule(claims, quotesModule);
  const canCreate = hasPermission(claims, "quotes:create");
  const canUpdate = hasPermission(claims, "quotes:update");
  const canDelete = hasPermission(claims, "quotes:delete");
  const canSend = hasPermission(claims, "quotes:send");
  const isNew = !quoteId;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [quote, setQuote] = React.useState<QuoteDetail | null>(null);

  const [companyName, setCompanyName] = React.useState("");
  const [companyTaxId, setCompanyTaxId] = React.useState("");
  const [representatives, setRepresentatives] = React.useState<
    Array<{ id: string; label: string }>
  >([]);
  const [issuers, setIssuers] = React.useState<QuoteIssuer[]>([]);
  const [statusCatalog, setStatusCatalog] = React.useState<QuoteStatusFlag[]>(
    [],
  );
  const [selectedStatusCode, setSelectedStatusCode] = React.useState("");
  const [projects, setProjects] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [tickets, setTickets] = React.useState<
    Array<{ id: string; title: string; projectId: string }>
  >([]);

  const [legalRepresentativeId, setLegalRepresentativeId] = React.useState("");
  const [issuerId, setIssuerId] = React.useState("");
  const [scope, setScope] = React.useState<QuoteScope>("company");
  const [projectId, setProjectId] = React.useState<string>("");
  const [ticketId, setTicketId] = React.useState<string>("");
  const [documentType, setDocumentType] =
    React.useState<QuoteDocumentType>("boleta");
  const [pdfLayoutId, setPdfLayoutId] = React.useState<QuotePdfLayoutId>(
    DEFAULT_QUOTE_PDF_LAYOUT_ID,
  );
  const [pdfPrimaryColor, setPdfPrimaryColor] = React.useState(
    DEFAULT_QUOTE_PDF_PRIMARY,
  );
  const [pdfSecondaryColor, setPdfSecondaryColor] = React.useState(
    DEFAULT_QUOTE_PDF_SECONDARY,
  );
  const [stylesOpen, setStylesOpen] = React.useState(false);
  const [clientVisible, setClientVisible] = React.useState(false);
  const [issueDate, setIssueDate] = React.useState(todayIso());
  const [expiresAt, setExpiresAt] = React.useState(addDaysIso(todayIso(), 30));
  const [sections, setSections] = React.useState<DraftSection[]>(emptySections());
  const [presets, setPresets] = React.useState<QuotePreset[]>([]);
  const [editorTab, setEditorTab] = React.useState<QuoteEditorTab>("datos");
  const [activeFrequency, setActiveFrequency] =
    React.useState<QuoteFrequency>("unico");
  const [activeGestionStep, setActiveGestionStep] =
    React.useState<GestionStep>("enlace");
  const [presetsOpen, setPresetsOpen] = React.useState(false);
  const [presetName, setPresetName] = React.useState("");
  const [presetPendingDeleteId, setPresetPendingDeleteId] = React.useState<
    string | null
  >(null);
  const [generateConfirmOpen, setGenerateConfirmOpen] = React.useState(false);
  const [defaultStatusConfirmOpen, setDefaultStatusConfirmOpen] =
    React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<
    "quote" | "preset" | "signed" | null
  >(null);

  const backHref = companyDetailHref(companyId, "cotizaciones");

  const load = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [company, issuerList, projectList, statusList, presetList] =
        await Promise.all([
          getCompanyDetail(surface, companyId),
          listQuoteIssuers(),
          listProjects("internal", { companyId }),
          listQuoteStatusCatalog(),
          listQuotePresets(companyId),
        ]);

      setCompanyName(company.name);
      setCompanyTaxId(company.taxId);
      setRepresentatives(
        (company.representativeLinks ?? []).map((link) => ({
          id: link.legalRepresentativeId,
          label: link.legalRepresentative
            ? `${link.legalRepresentative.firstName} ${link.legalRepresentative.lastName} · ${link.legalRepresentative.identificationNumber}`
            : link.legalRepresentativeId,
        })),
      );
      setIssuers(issuerList);
      setStatusCatalog(statusList);
      setPresets(presetList);
      setProjects(projectList.map((p) => ({ id: p.id, name: p.name })));

      const ticketLists = await Promise.all(
        projectList.map(async (project) => {
          const rows = await listTickets("internal", { projectId: project.id });
          return rows.map((ticket) => ({
            id: ticket.id,
            title: ticket.title,
            projectId: project.id,
          }));
        }),
      );
      setTickets(ticketLists.flat());

      if (quoteId) {
        const detail = await getQuoteDetail(quoteId);
        setQuote(detail);
        setLegalRepresentativeId(detail.legalRepresentativeId);
        setIssuerId(detail.issuerId);
        setScope(detail.scope);
        setProjectId(detail.projectId ?? "");
        setTicketId(detail.ticketId ?? "");
        setDocumentType(detail.documentType);
        setPdfLayoutId(
          isQuotePdfLayoutId(detail.pdfLayoutId)
            ? detail.pdfLayoutId
            : DEFAULT_QUOTE_PDF_LAYOUT_ID,
        );
        setPdfPrimaryColor(
          isHexColor(detail.pdfPrimaryColor)
            ? detail.pdfPrimaryColor
            : DEFAULT_QUOTE_PDF_PRIMARY,
        );
        setPdfSecondaryColor(
          isHexColor(detail.pdfSecondaryColor)
            ? detail.pdfSecondaryColor
            : DEFAULT_QUOTE_PDF_SECONDARY,
        );
        setClientVisible(detail.clientVisible);
        setIssueDate(detail.issueDate);
        setExpiresAt(detail.expiresAt);
        const loadedSections = sectionsFromQuote(detail);
        setSections(loadedSections);
        setActiveFrequency(initialActiveFrequency(loadedSections));
        setSelectedStatusCode(detail.statusFlags?.[0]?.code ?? "creado");
      } else {
        if (issuerList[0]) setIssuerId(issuerList[0].id);
        const firstRep = company.representativeLinks?.[0]?.legalRepresentativeId;
        if (firstRep) setLegalRepresentativeId(firstRep);
        setActiveFrequency("unico");
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo cargar la cotización.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, claims, companyId, quoteId, surface]);

  React.useEffect(() => {
    if (!isAuthLoading) void load();
  }, [isAuthLoading, load]);

  React.useEffect(() => {
    setExpiresAt(addDaysIso(issueDate, 30));
  }, [issueDate]);

  const ticketsForProject = React.useMemo(() => {
    if (scope === "ticket" && projectId) {
      return tickets.filter((t) => t.projectId === projectId);
    }
    return tickets;
  }, [projectId, scope, tickets]);

  const representativeItems = React.useMemo(
    () => representatives.map((rep) => ({ value: rep.id, label: rep.label })),
    [representatives],
  );

  const issuerItems = React.useMemo(
    () =>
      issuers.map((issuer) => ({
        value: issuer.id,
        label: `${issuer.fullName} · ${issuer.taxId}`,
      })),
    [issuers],
  );

  const projectItems = React.useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.name })),
    [projects],
  );

  const ticketItems = React.useMemo(
    () =>
      ticketsForProject.map((ticket) => ({
        value: ticket.id,
        label: ticket.title,
      })),
    [ticketsForProject],
  );

  const scopeItems = [
    { value: "company", label: "Empresa" },
    { value: "project", label: "Proyecto" },
    { value: "ticket", label: "Ticket" },
  ] as const;

  const documentTypeItems = [
    { value: "boleta", label: "Boleta de honorarios" },
    { value: "factura", label: "Factura (SpA)" },
  ] as const;

  const priceInputModeItems = [
    { value: "gross", label: "Montos brutos" },
    { value: "liquid", label: "Montos líquidos" },
  ] as const;

  const previewModel = React.useMemo((): QuotePreviewModel => {
    const issuer = issuers.find((item) => item.id === issuerId);
    const rep = representatives.find((item) => item.id === legalRepresentativeId);
    return {
      quoteNumber: quote?.quoteNumber ?? "—",
      companyName: companyName || "—",
      companyTaxId: companyTaxId || "—",
      legalRepresentativeName: rep?.label.split(" · ")[0] ?? "—",
      legalRepresentativeTaxId: rep?.label.split(" · ")[1] ?? "—",
      issuerName: issuer?.fullName ?? "—",
      issuerTaxId: issuer?.taxId ?? "—",
      issuerService: issuer?.serviceDescription ?? "—",
      issuerPhone: issuer?.phoneNumber ?? null,
      issuerEmail: issuer?.email ?? null,
      documentType,
      issueDate,
      expiresAt,
      pdfLayoutId,
      pdfPrimaryColor,
      pdfSecondaryColor,
      sections: sections
        .map((section) => ({
          frequency: section.frequency,
          esCanje: section.esCanje,
          applyTax: section.applyTax,
          priceInputMode: section.priceInputMode,
          items: section.items
            .filter((item) => item.title.trim() && Number(item.price) !== 0)
            .map((item) => ({
              title: item.title.trim(),
              description: item.description.trim(),
              price: Number(item.price),
            })),
        }))
        .filter((section) => section.items.length > 0),
    };
  }, [
    issuers,
    issuerId,
    representatives,
    legalRepresentativeId,
    quote?.quoteNumber,
    companyName,
    companyTaxId,
    documentType,
    issueDate,
    expiresAt,
    pdfLayoutId,
    pdfPrimaryColor,
    pdfSecondaryColor,
    sections,
  ]);

  const buildPayload = (): CreateQuotePayload | null => {
    if (!legalRepresentativeId || !issuerId) {
      toast.error("Selecciona emisor y representante legal.");
      return null;
    }

    const sectionPayloads: QuoteSectionPayload[] = sections
      .map((section) => ({
        frequency: section.frequency,
        esCanje: section.esCanje,
        applyTax: section.applyTax,
        priceInputMode:
          documentType === "boleta" ? section.priceInputMode : "gross",
        items: section.items
          .filter((item) => item.title.trim() && Number(item.price) !== 0)
          .map((item) => ({
            title: item.title.trim(),
            description: item.description.trim(),
            price: Number(item.price),
          })),
      }))
      .filter((section) => section.items.length > 0);

    if (sectionPayloads.length === 0) {
      toast.error("Agrega al menos un ítem en alguna sección de pagos.");
      return null;
    }

    if (scope === "project" && !projectId) {
      toast.error("Selecciona el proyecto.");
      return null;
    }
    if (scope === "ticket" && !ticketId) {
      toast.error("Selecciona el ticket.");
      return null;
    }

    return {
      companyId,
      legalRepresentativeId,
      issuerId,
      scope,
      projectId: scope === "company" ? null : projectId || null,
      ticketId: scope === "ticket" ? ticketId : null,
      documentType,
      pdfLayoutId,
      pdfPrimaryColor,
      pdfSecondaryColor,
      clientVisible,
      issueDate,
      expiresAt,
      statusCode: selectedStatusCode || undefined,
      sections: sectionPayloads,
    };
  };

  const requestGenerate = () => {
    if (isNew && !canCreate) return;
    if (!isNew && !canUpdate) return;
    const payload = buildPayload();
    if (!payload) return;
    if (!selectedStatusCode) {
      setDefaultStatusConfirmOpen(true);
      return;
    }
    setGenerateConfirmOpen(true);
  };

  const handleSave = async () => {
    if (isNew && !canCreate) return;
    if (!isNew && !canUpdate) return;

    const payload = buildPayload();
    if (!payload) return;
    const statusCode = selectedStatusCode || "creado";

    setIsSaving(true);
    try {
      if (isNew) {
        await createQuote({ ...payload, statusCode });
        setGenerateConfirmOpen(false);
        setDefaultStatusConfirmOpen(false);
        toast.success(
          statusCode === "creado"
            ? "Cotización creada con estado Creado"
            : "Cotización creada",
        );
        router.push(backHref);
      } else if (quoteId) {
        const { companyId: _companyId, ...updatePayload } = payload;
        await updateQuote(quoteId, { ...updatePayload, statusCode });
        setGenerateConfirmOpen(false);
        setDefaultStatusConfirmOpen(false);
        toast.success("Cotización actualizada");
        router.push(backHref);
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo guardar.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const buildPresetPayload = (): QuotePresetPayload => {
    const theme = resolveQuotePdfTheme({
      layoutId: pdfLayoutId,
      primary: pdfPrimaryColor,
      secondary: pdfSecondaryColor,
    });

    return {
      legalRepresentativeId: legalRepresentativeId || undefined,
      issuerId: issuerId || undefined,
      scope,
      projectId: scope === "company" ? null : projectId || null,
      ticketId: scope === "ticket" ? ticketId || null : null,
      documentType,
      pdfLayoutId: theme.layoutId,
      pdfPrimaryColor: theme.primary,
      pdfSecondaryColor: theme.secondary,
      clientVisible,
      sections: sections.map((section) => ({
        frequency: section.frequency,
        esCanje: section.esCanje,
        applyTax: section.applyTax,
        priceInputMode: section.priceInputMode,
        items: section.items.map((item) => ({
          title: item.title,
          description: item.description,
          price: item.price,
        })),
      })),
    };
  };

  const normalizePresetPayload = (
    raw: QuotePreset["payload"] | string | null | undefined,
  ): QuotePresetPayload => {
    if (!raw) return {};
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as QuotePresetPayload;
      } catch {
        return {};
      }
    }
    return raw;
  };

  const applyPreset = (preset: QuotePreset) => {
    const data = normalizePresetPayload(preset.payload);
    if (data.legalRepresentativeId) {
      setLegalRepresentativeId(data.legalRepresentativeId);
    }
    if (data.issuerId) {
      setIssuerId(data.issuerId);
    }
    if (data.scope) {
      setScope(data.scope);
    }
    if (data.projectId !== undefined) {
      setProjectId(data.projectId ?? "");
    }
    if (data.ticketId !== undefined) {
      setTicketId(data.ticketId ?? "");
    }
    if (data.documentType) {
      setDocumentType(data.documentType);
    }

    // Siempre aplicar estilos del PDF del preset (layout + colores).
    const theme = resolveQuotePdfTheme({
      layoutId: data.pdfLayoutId,
      primary: data.pdfPrimaryColor,
      secondary: data.pdfSecondaryColor,
    });
    setPdfLayoutId(theme.layoutId);
    setPdfPrimaryColor(theme.primary);
    setPdfSecondaryColor(theme.secondary);

    if (typeof data.clientVisible === "boolean") {
      setClientVisible(data.clientVisible);
    }
    if (data.sections?.length) {
      const next = emptySections();
      for (const section of data.sections) {
        const target = next.find((row) => row.frequency === section.frequency);
        if (!target) continue;
        target.esCanje = section.esCanje;
        target.applyTax = section.applyTax;
        target.priceInputMode = section.priceInputMode ?? "gross";
        target.items = (section.items ?? []).map((item, index) => ({
          key: `${section.frequency}-preset-${index}`,
          title: item.title ?? "",
          description: item.description ?? "",
          price: String(item.price ?? ""),
        }));
      }
      setSections(next);
      setActiveFrequency(initialActiveFrequency(next));
    }
    // Fechas no se tocan a propósito
    setPresetsOpen(false);
    toast.success(`Preset «${preset.name}» cargado`);
  };

  const handleCreatePreset = async () => {
    if (!presetName.trim()) {
      toast.error("Escribe un nombre para el preset.");
      return;
    }
    setIsSaving(true);
    try {
      const created = await createQuotePreset({
        name: presetName.trim(),
        companyId,
        payload: buildPresetPayload(),
      });
      setPresets((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setPresetName("");
      toast.success("Preset creado (incluye estilos del PDF)");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo crear el preset.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePreset = async (preset: QuotePreset) => {
    setIsSaving(true);
    try {
      const updated = await updateQuotePreset(preset.id, {
        payload: buildPresetPayload(),
      });
      setPresets((current) =>
        current.map((item) => (item.id === preset.id ? updated : item)),
      );
      toast.success(`Preset «${preset.name}» actualizado (con estilos del PDF)`);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el preset.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePreset = async () => {
    if (!presetPendingDeleteId) return;
    setIsSaving(true);
    try {
      await deleteQuotePreset(presetPendingDeleteId);
      setPresets((current) =>
        current.filter((item) => item.id !== presetPendingDeleteId),
      );
      setPresetPendingDeleteId(null);
      setConfirmDelete(null);
      toast.success("Preset eliminado");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo eliminar el preset.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quoteId || !canDelete) return;
    setIsSaving(true);
    try {
      await deleteQuote(quoteId);
      setConfirmDelete(null);
      toast.success("Cotización eliminada");
      router.push(backHref);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo eliminar.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!quoteId || !canSend) return;
    setIsSaving(true);
    try {
      const updated = await sendQuote(quoteId);
      setQuote(updated);
      setSelectedStatusCode(updated.statusFlags?.[0]?.code ?? "creado");
      toast.success("Cotización enviada; enlace activo por 24 horas");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo enviar.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleShare = async (enabled: boolean) => {
    if (!quoteId || !canSend) return;
    setIsSaving(true);
    try {
      const updated = await toggleQuoteShare(quoteId, enabled);
      setQuote(updated);
      setSelectedStatusCode(updated.statusFlags?.[0]?.code ?? "creado");
      toast.success(
        enabled
          ? "Enlace habilitado (24 horas desde ahora)"
          : "Enlace deshabilitado",
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo actualizar el enlace.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStatuses = async () => {
    if (!quoteId || !canUpdate) return;
    const statusCode = selectedStatusCode || "creado";
    setIsSaving(true);
    try {
      const updated = await setQuoteStatus(quoteId, statusCode);
      setQuote(updated);
      setSelectedStatusCode(updated.statusFlags?.[0]?.code ?? statusCode);
      toast.success("Estado actualizado");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo guardar el estado.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectStatusCode = (code: string) => {
    setSelectedStatusCode(code);
  };

  const handleUploadSigned = async (file: File | null) => {
    if (!quoteId || !canUpdate || !file) return;
    setIsSaving(true);
    try {
      const updated = await uploadQuoteSignedDocument(quoteId, file);
      setQuote(updated);
      toast.success("Documento firmado subido");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo subir el archivo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSigned = async () => {
    if (!quoteId || !canUpdate) return;
    setIsSaving(true);
    try {
      const updated = await removeQuoteSignedDocument(quoteId);
      setQuote(updated);
      setConfirmDelete(null);
      toast.success("Documento firmado eliminado");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo eliminar el archivo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSigned = async () => {
    if (!quote?.signedAssetId) return;
    try {
      const { url } = await getAssetDownloadUrl("internal", quote.signedAssetId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo descargar el archivo.",
      );
    }
  };

  const handleDownloadPdf = () => {
    if (!quote) {
      toast.error("Guarda la cotización antes de descargar el PDF.");
      return;
    }
    void generateQuotePdf({
      ...quote,
      pdfLayoutId,
      pdfPrimaryColor,
      pdfSecondaryColor,
    });
  };

  const copyPublicLink = async () => {
    const token = quote?.shareLink?.token;
    if (!token) return;
    const url = `${window.location.origin}${publicQuoteHref(token)}`;
    await navigator.clipboard.writeText(url);
    toast.success("Enlace copiado");
  };

  const updateSection = (
    frequency: QuoteFrequency,
    patch: Partial<DraftSection>,
  ) => {
    setSections((current) =>
      current.map((section) =>
        section.frequency === frequency ? { ...section, ...patch } : section,
      ),
    );
  };

  const addItem = (frequency: QuoteFrequency) => {
    updateSection(frequency, {
      items: [
        ...(sections.find((s) => s.frequency === frequency)?.items ?? []),
        {
          key: `${frequency}-${Date.now()}`,
          title: "",
          description: "",
          price: "",
        },
      ],
    });
  };

  const updateItem = (
    frequency: QuoteFrequency,
    key: string,
    patch: Partial<DraftItem>,
  ) => {
    const section = sections.find((s) => s.frequency === frequency);
    if (!section) return;
    updateSection(frequency, {
      items: section.items.map((item) =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    });
  };

  const removeItem = (frequency: QuoteFrequency, key: string) => {
    const section = sections.find((s) => s.frequency === frequency);
    if (!section) return;
    updateSection(frequency, {
      items: section.items.filter((item) => item.key !== key),
    });
  };

  if (isAuthLoading || isLoading) {
    return <ListSkeleton rows={8} />;
  }

  if (!canAccess || errorMessage) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft />
          Volver
        </Link>
        <ErrorState
          message={errorMessage ?? "No tienes acceso a cotizaciones."}
          onRetry={load}
        />
      </div>
    );
  }

  const shareActive =
    !!quote?.shareLink?.isEnabled &&
    !!quote.shareLink.expiresAt &&
    new Date(quote.shareLink.expiresAt).getTime() > Date.now();

  return (
    <div className="mx-auto max-w-[90rem] pr-1 sm:pr-2 md:pr-3">
      <div className="grid items-start gap-8 lg:gap-10 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:grid-cols-2 2xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4 self-start lg:sticky lg:top-4 lg:pr-3 xl:pr-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={backHref}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ArrowLeft />
                Cotizaciones
              </Link>
              {!isNew && quote ? (
                <ScopeLinks quote={quote} companyId={companyId} />
              ) : null}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isNew
                  ? "Nueva cotización"
                  : `Cotización #${quote?.quoteNumber ?? ""}`}
              </h1>
              <p className="text-sm text-muted-foreground">
                {companyName} · RUT {companyTaxId}
              </p>
            </div>
            {!isNew ? (
              <div className="flex flex-wrap gap-2">
                {quote ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPdf}
                  >
                    <Download />
                    PDF
                  </Button>
                ) : null}
                {clientVisible && canSend ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => void handleSend()}
                  >
                    <Check />
                    Enviar
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={isSaving}
                    onClick={() => setConfirmDelete("quote")}
                  >
                    <Trash2 />
                    Eliminar
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <Tabs
            value={editorTab}
            onValueChange={(value) => {
              if (value === "datos" || value === "pagos" || value === "gestion") {
                setEditorTab(value);
              }
            }}
            className="gap-3"
          >
            <div className="-mx-1 px-1 pb-3">
              <TabsList className="w-full max-w-none">
                <TabsTab value="datos" className="flex-1">
                  <TabLabel
                    icon={FileText}
                    label="Datos"
                    shortLabel="Datos"
                  />
                </TabsTab>
                <TabsTab value="pagos" className="flex-1">
                  <TabLabel
                    icon={ListOrdered}
                    label="Pagos"
                    shortLabel="Pagos"
                  />
                </TabsTab>
                {!isNew ? (
                  <TabsTab value="gestion" className="flex-1">
                    <TabLabel
                      icon={Settings2}
                      label="Gestión"
                      shortLabel="Gestión"
                    />
                  </TabsTab>
                ) : null}
                <TabsIndicator />
              </TabsList>
            </div>

        <TabsPanel value="datos" className="space-y-4">
          <Card className="border-primary/25 bg-primary/5 ring-1 ring-primary/15">
            <CardHeader className="border-b border-primary/15 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-primary">Datos del documento</CardTitle>
                  <CardDescription>
                    Empresa, representante, emisor, alcance y tipo de documento.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Empresa</Label>
                <Input value={`${companyName} (${companyTaxId})`} disabled />
              </div>

              <div className="space-y-1.5">
                <Label>Representante legal</Label>
                <Select
                  items={representativeItems}
                  value={legalRepresentativeId || null}
                  onValueChange={(v: string | null) =>
                    setLegalRepresentativeId(v ?? "")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {representativeItems.map((rep) => (
                      <SelectItem key={rep.value} value={rep.value}>
                        {rep.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Emisor</Label>
                <Select
                  items={issuerItems}
                  value={issuerId || null}
                  onValueChange={(v: string | null) => setIssuerId(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {issuerItems.map((issuer) => (
                      <SelectItem key={issuer.value} value={issuer.value}>
                        {issuer.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Alcance</Label>
                <Select
                  items={[...scopeItems]}
                  value={scope}
                  onValueChange={(v: string | null) => {
                    const next = (v as QuoteScope) ?? "company";
                    setScope(next);
                    if (next === "company") {
                      setProjectId("");
                      setTicketId("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {scope !== "company" ? (
                <div className="space-y-1.5">
                  <Label>Proyecto</Label>
                  <Select
                    items={projectItems}
                    value={projectId || null}
                    onValueChange={(v: string | null) => {
                      setProjectId(v ?? "");
                      setTicketId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectItems.map((project) => (
                        <SelectItem key={project.value} value={project.value}>
                          {project.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {scope === "ticket" ? (
                <div className="space-y-1.5">
                  <Label>Ticket</Label>
                  <Select
                    items={ticketItems}
                    value={ticketId || null}
                    onValueChange={(v: string | null) => {
                      const next = v ?? "";
                      setTicketId(next);
                      const ticket = tickets.find((row) => row.id === next);
                      if (ticket) {
                        setProjectId(ticket.projectId);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ticket" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketItems.map((ticket) => (
                        <SelectItem key={ticket.value} value={ticket.value}>
                          {ticket.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>Tipo de documento</Label>
                <Select
                  items={[...documentTypeItems]}
                  value={documentType}
                  onValueChange={(v: string | null) =>
                    setDocumentType((v as QuoteDocumentType) ?? "boleta")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-primary" />
                  Fecha de emisión
                </Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-secondary" />
                  Validez
                </Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <OptionChip
                  id="client-visible"
                  checked={clientVisible}
                  onCheckedChange={setClientVisible}
                  label="Visible para el cliente (enlace público y notificación)"
                  tone="secondary"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Estado de la cotización</Label>
                <p className="text-xs text-muted-foreground">
                  Solo un estado a la vez. Si no eliges ninguno, al guardar se
                  usará «Creado».
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusCatalog.map((item) => (
                    <OptionChip
                      key={item.code}
                      id={`status-datos-${item.code}`}
                      checked={selectedStatusCode === item.code}
                      onCheckedChange={(checked) =>
                        selectStatusCode(checked ? item.code : "")
                      }
                      label={item.name}
                      tone={
                        item.category === "payment" ? "primary" : "secondary"
                      }
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsPanel>

        <TabsPanel value="pagos" className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Elige un tipo de pago para editarlo. Los otros se mantienen
              guardados; cambia de pestaña cuando quieras.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCY_ORDER.map((frequency) => {
                const theme = FREQUENCY_THEME[frequency];
                const SectionIcon = theme.Icon;
                const selected = activeFrequency === frequency;
                const itemCount =
                  sections.find((section) => section.frequency === frequency)
                    ?.items.length ?? 0;

                return (
                  <button
                    key={frequency}
                    type="button"
                    onClick={() => setActiveFrequency(frequency)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      selected
                        ? cn("ring-1", theme.card)
                        : "border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          selected ? theme.iconWrap : "bg-muted text-muted-foreground",
                        )}
                      >
                        <SectionIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            selected ? theme.accentText : "text-foreground",
                          )}
                        >
                          {FREQUENCY_SHORT[frequency]}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {itemCount > 0
                            ? `${itemCount} ítem${itemCount === 1 ? "" : "s"}`
                            : "Sin ítems"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {sections
            .filter((section) => section.frequency === activeFrequency)
            .map((section) => {
            const totals = calculateSectionTotals({
              itemPrices: section.items.map((item) => Number(item.price) || 0),
              documentType,
              applyTax: section.applyTax,
              priceInputMode: section.priceInputMode,
            });
            const theme = FREQUENCY_THEME[section.frequency];
            const SectionIcon = theme.Icon;

            return (
              <Card
                key={section.frequency}
                className={cn("border ring-1", theme.card)}
              >
                <CardHeader className="gap-3 border-b border-border/40 pb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        theme.iconWrap,
                      )}
                    >
                      <SectionIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={theme.accentText}>
                        {FREQUENCY_TITLE[section.frequency]}
                      </CardTitle>
                      <CardDescription>
                        Ítems opcionales. Precios negativos = descuento.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OptionChip
                      id={`${section.frequency}-canje`}
                      checked={section.esCanje}
                      onCheckedChange={(checked) =>
                        updateSection(section.frequency, { esCanje: checked })
                      }
                      label="Canje"
                      tone="secondary"
                    />
                    <OptionChip
                      id={`${section.frequency}-tax`}
                      checked={section.applyTax}
                      onCheckedChange={(checked) =>
                        updateSection(section.frequency, { applyTax: checked })
                      }
                      label={
                        documentType === "factura"
                          ? "Incluir IVA 19%"
                          : `Incluir retención ${(RETENTION_RATE_2026 * 100).toLocaleString("es-CL")}%`
                      }
                      tone="primary"
                    />
                    {documentType === "boleta" && section.applyTax ? (
                      <Select
                        items={[...priceInputModeItems]}
                        value={section.priceInputMode}
                        onValueChange={(v: string | null) =>
                          updateSection(section.frequency, {
                            priceInputMode: (v as PriceInputMode) ?? "gross",
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-[180px] border-primary/30 bg-background/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priceInputModeItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {section.items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-4 text-center text-sm text-muted-foreground">
                      Sin ítems en esta sección.
                    </p>
                  ) : null}
                  {section.items.map((item, index) => (
                    <div
                      key={item.key}
                      className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-xs font-medium", theme.accentText)}>
                          Ítem {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            removeItem(section.frequency, item.key)
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                        <div className="space-y-1.5">
                          <Label htmlFor={`${item.key}-title`}>Nombre</Label>
                          <Input
                            id={`${item.key}-title`}
                            placeholder="Proyecto / servicio"
                            value={item.title}
                            onChange={(e) =>
                              updateItem(section.frequency, item.key, {
                                title: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`${item.key}-price`}>Precio</Label>
                          <Input
                            id={`${item.key}-price`}
                            type="number"
                            placeholder="0"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(section.frequency, item.key, {
                                price: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${item.key}-description`}>
                          Comentario / descripción
                        </Label>
                        <textarea
                          id={`${item.key}-description`}
                          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[72px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                          placeholder="Detalle del ítem"
                          value={item.description}
                          rows={3}
                          onChange={(e) =>
                            updateItem(section.frequency, item.key, {
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant={theme.addVariant}
                    size="sm"
                    className={cn("w-full sm:w-auto", theme.addClassName)}
                    onClick={() => addItem(section.frequency)}
                  >
                    <Plus />
                    Agregar ítem
                  </Button>
                  {section.items.length > 0 ? (
                    <div
                      className={cn(
                        "space-y-1.5 rounded-lg border px-3 py-3 text-sm",
                        theme.totals,
                      )}
                    >
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatClp(totals.subtotal)}</span>
                      </div>
                      {documentType === "factura" && section.applyTax ? (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IVA 19%</span>
                          <span>{formatClp(totals.taxAmount)}</span>
                        </div>
                      ) : null}
                      {documentType === "boleta" && section.applyTax ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Retención 15,25%
                            </span>
                            <span>{formatClp(totals.retentionAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Líquido</span>
                            <span>{formatClp(totals.liquidAmount)}</span>
                          </div>
                        </>
                      ) : null}
                      <div
                        className={cn(
                          "flex justify-between border-t border-border/40 pt-1.5 font-semibold",
                          theme.accentText,
                        )}
                      >
                        <span>Total</span>
                        <span>{formatClp(totals.total)}</span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </TabsPanel>

        {!isNew && quote ? (
          <TabsPanel value="gestion" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Elige una sección para gestionarla. Cambia de paso cuando
                quieras; no se pierde lo que ya configuraste.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {GESTION_STEPS.map((step) => {
                  const selected = activeGestionStep === step.id;
                  const StepIcon = step.Icon;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveGestionStep(step.id)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? cn("ring-1", step.card)
                          : "border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
                            selected
                              ? step.iconWrap
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <StepIcon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              selected ? step.accentText : "text-foreground",
                            )}
                          >
                            {step.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeGestionStep === "enlace" ? (
            <Card className="border-secondary/35 bg-secondary/10 ring-1 ring-secondary/20">
              <CardHeader className="border-b border-secondary/20 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Link2 className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-secondary">
                      Enlace de revisión
                    </CardTitle>
                    <CardDescription>
                      El enlace público dura 24 horas desde que se habilita. Al
                      re-habilitar se reinicia el plazo.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      shareActive
                        ? "border-transparent bg-secondary text-secondary-foreground"
                        : "border-border/70 text-muted-foreground"
                    }
                  >
                    {shareActive ? "Activo" : "Inactivo"}
                  </Badge>
                  {shareActive && quote.shareLink?.expiresAt ? (
                    <span className="text-sm text-muted-foreground">
                      Vence:{" "}
                      {new Date(quote.shareLink.expiresAt).toLocaleString("es-CL")}
                    </span>
                  ) : null}
                </div>
                {!clientVisible ? (
                  <p className="rounded-lg border border-dashed border-border/60 bg-background/50 px-3 py-2 text-sm text-muted-foreground">
                    Activa “Visible para el cliente” en Datos para poder generar
                    el enlace.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving || !canSend}
                      onClick={() => void handleToggleShare(true)}
                    >
                      <Link2 />
                      Habilitar (24h)
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isSaving || !canSend || !quote.shareLink?.isEnabled}
                      onClick={() => void handleToggleShare(false)}
                    >
                      <Link2Off />
                      Deshabilitar
                    </Button>
                    {quote.shareLink?.token ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-secondary/40 text-secondary"
                        onClick={() => void copyPublicLink()}
                      >
                        <Copy />
                        Copiar enlace
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
            ) : null}

            {activeGestionStep === "estados" ? (
            <Card className="border-primary/30 bg-primary/5 ring-1 ring-primary/15">
              <CardHeader className="gap-3 border-b border-primary/15 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <ListOrdered className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-primary">
                      Estado del documento
                    </CardTitle>
                    <CardDescription>
                      Solo un estado a la vez. El canje se marca por tipo de pago
                      (único / mensual / anual), no aquí.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving || !canUpdate}
                  onClick={() => void handleSaveStatuses()}
                >
                  Guardar estado
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap gap-2">
                  {statusCatalog.map((item) => (
                    <OptionChip
                      key={item.code}
                      id={`status-${item.code}`}
                      checked={selectedStatusCode === item.code}
                      onCheckedChange={(checked) =>
                        selectStatusCode(checked ? item.code : "")
                      }
                      label={item.name}
                      tone={
                        item.category === "payment" ? "primary" : "secondary"
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            ) : null}

            {activeGestionStep === "firmado" ? (
            <Card className="border-chart-3/40 bg-chart-3/10 ring-1 ring-chart-3/25">
              <CardHeader className="border-b border-chart-3/25 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chart-3 text-foreground">
                    <FileSignature className="size-4" />
                  </div>
                  <div>
                    <CardTitle>Documento firmado</CardTitle>
                    <CardDescription>
                      Máximo 1 archivo: el PDF u otro documento que el cliente te
                      devolvió firmado (la app no firma).
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {quote.signedAsset ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {quote.signedAsset.fileName}
                    </Badge>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleDownloadSigned()}
                    >
                      <Download />
                      Descargar
                    </Button>
                    {canUpdate ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => setConfirmDelete("signed")}
                      >
                        <Trash2 />
                        Eliminar
                      </Button>
                    ) : null}
                  </div>
                ) : canUpdate ? (
                  <div className="rounded-lg border border-dashed border-chart-3/40 bg-background/50 p-3">
                    <Label htmlFor="signed-upload" className="mb-2 block">
                      Subir documento firmado
                    </Label>
                    <Input
                      id="signed-upload"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                      disabled={isSaving}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        void handleUploadSigned(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin documento firmado.
                  </p>
                )}
              </CardContent>
            </Card>
            ) : null}
          </TabsPanel>
        ) : null}
          </Tabs>
        </aside>

        <aside className="min-w-0 space-y-3 lg:pl-1 xl:pl-2">
          <div className="space-y-3 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Documento</h2>
              <Badge variant="secondary" className="font-normal">
                {getQuotePdfLayout(pdfLayoutId).name}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSaving}
                onClick={() => setPresetsOpen(true)}
              >
                <BookmarkPlus />
                Preset
              </Button>
              <HelpHint
                label="Qué es un preset"
                side="bottom"
                text="Un preset guarda la configuración actual: representante, emisor, alcance, tipo, visibilidad, ítems y también los estilos del PDF (layout y colores). Al cargar no se tocan las fechas."
              />
              <Button
                type="button"
                size="sm"
                disabled={isSaving || (isNew ? !canCreate : !canUpdate)}
                onClick={requestGenerate}
              >
                <FileText />
                {isSaving ? "Generando…" : "Generar documento"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStylesOpen(true)}
              >
                <Palette />
                Estilos del PDF
              </Button>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3 sm:p-4">
            <QuotePreviewDocument model={previewModel} />
          </div>
        </aside>
      </div>

      <Dialog open={stylesOpen} onOpenChange={setStylesOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Estilos del PDF</DialogTitle>
            <DialogDescription>
              Primero elige cómo se organiza la información. Después define los
              colores. El fondo siempre es blanco.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Estilo / layout</p>
              <div className="grid gap-2">
                {QUOTE_PDF_LAYOUTS.map((layout) => {
                  const selected = pdfLayoutId === layout.id;
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setPdfLayoutId(layout.id)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                          : "border-border/70 hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{layout.name}</p>
                        {selected ? (
                          <Badge className="bg-primary text-primary-foreground">
                            Activo
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {layout.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 border-t border-border/60 pt-4">
              <p className="text-sm font-medium">Colores</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Principal</p>
                  <div className="flex flex-wrap gap-2">
                    {QUOTE_PDF_PRIMARY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => setPdfPrimaryColor(color)}
                        className={cn(
                          "size-8 rounded-lg border-2 shadow-sm",
                          pdfPrimaryColor === color
                            ? "border-foreground scale-110"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Secundario</p>
                  <div className="flex flex-wrap gap-2">
                    {QUOTE_PDF_SECONDARY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => setPdfSecondaryColor(color)}
                        className={cn(
                          "size-8 rounded-lg border-2 shadow-sm",
                          pdfSecondaryColor === color
                            ? "border-foreground scale-110"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm">
                  <span
                    className="size-6 rounded-md border border-black/10"
                    style={{ backgroundColor: QUOTE_PDF_BACKGROUND }}
                  />
                  <span className="text-muted-foreground">Background</span>
                  <span className="font-mono text-xs">
                    {QUOTE_PDF_BACKGROUND}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    Fijo
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setStylesOpen(false)}>
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={presetsOpen}
        onOpenChange={(open) => {
          setPresetsOpen(open);
          if (!open) setPresetName("");
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Presets</DialogTitle>
            <DialogDescription>
              Guarda la configuración actual del documento, incluidos los
              estilos del PDF (layout y colores). Las fechas no forman parte del
              preset. Puedes crear, cargar, actualizar o eliminar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="preset-name">Nuevo preset</Label>
              <div className="flex gap-2">
                <Input
                  id="preset-name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Ej. Mantención mensual boleta"
                  disabled={isSaving}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleCreatePreset();
                    }
                  }}
                />
                <Button
                  type="button"
                  disabled={isSaving || !presetName.trim()}
                  onClick={() => void handleCreatePreset()}
                >
                  <Plus />
                  Crear
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Presets guardados</p>
              {presets.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  Aún no hay presets. Crea uno con el formulario de arriba.
                </p>
              ) : (
                <ul className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-1">
                  {presets.map((preset) => (
                    <li
                      key={preset.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {preset.name}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={isSaving}
                          aria-label={`Cargar preset ${preset.name}`}
                          title="Cargar"
                          onClick={() => applyPreset(preset)}
                        >
                          <FolderOpen />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={isSaving}
                          aria-label={`Actualizar preset ${preset.name}`}
                          title="Actualizar con el documento actual"
                          onClick={() => void handleUpdatePreset(preset)}
                        >
                          <RefreshCw />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={isSaving}
                          aria-label={`Eliminar preset ${preset.name}`}
                          title="Eliminar"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setPresetPendingDeleteId(preset.id);
                            setConfirmDelete("preset");
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPresetsOpen(false)}
              disabled={isSaving}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={defaultStatusConfirmOpen}
        onOpenChange={setDefaultStatusConfirmOpen}
        title="Sin estado seleccionado"
        description={
          <div className="space-y-3 text-left leading-relaxed">
            <p>
              No elegiste un estado comercial para esta cotización.
            </p>
            <p>
              Al continuar se guardará con el estado{" "}
              <span className="font-semibold text-foreground">Creado</span>.
              Esto es solo un aviso: puedes cambiarlo después en el editor.
            </p>
          </div>
        }
        confirmLabel="Continuar con Creado"
        cancelLabel="Volver"
        confirmVariant="default"
        onConfirm={() => {
          setSelectedStatusCode("creado");
          setDefaultStatusConfirmOpen(false);
          setGenerateConfirmOpen(true);
        }}
        isConfirming={false}
      />

      <ConfirmDialog
        open={generateConfirmOpen}
        onOpenChange={setGenerateConfirmOpen}
        title="Generar documento"
        description={
          quote?.status === "sent" ? (
            <div className="space-y-3 text-left leading-relaxed">
              <p>
                Se guardarán los cambios de la cotización con lo que ves en la
                vista previa.
              </p>
              <p>
                Como ya fue enviada, en el listado seguirá con la etiqueta{" "}
                <span className="font-semibold text-foreground">Enviada</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-left leading-relaxed">
              <p>
                Se guardará la cotización con lo que ves en la{" "}
                <span className="font-semibold text-foreground">
                  vista previa
                </span>
                .
              </p>
              <p>
                Si todavía{" "}
                <span className="font-semibold text-foreground">
                  no la envías al cliente
                </span>{" "}
                (botón{" "}
                <span className="font-semibold text-foreground">Enviar</span>),
                quedará guardada con su estado comercial (por ejemplo{" "}
                <span className="font-semibold text-foreground">Creado</span>)
                sin aparecer como enviada.
              </p>
            </div>
          )
        }
        confirmLabel={isNew ? "Generar" : "Guardar cambios"}
        cancelLabel="Cancelar"
        confirmVariant="default"
        onConfirm={() => handleSave()}
        isConfirming={isSaving}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDelete(null);
            setPresetPendingDeleteId(null);
          }
        }}
        title={
          confirmDelete === "quote"
            ? "Eliminar cotización"
            : confirmDelete === "preset"
              ? "Eliminar preset"
              : "Eliminar documento firmado"
        }
        description={
          confirmDelete === "quote"
            ? "¿Eliminar esta cotización? Esta acción no se puede deshacer."
            : confirmDelete === "preset"
              ? "¿Eliminar este preset? Ya no podrás cargarlo en nuevas cotizaciones."
              : "¿Eliminar el documento firmado asociado a esta cotización?"
        }
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (confirmDelete === "quote") return handleDelete();
          if (confirmDelete === "preset") return handleDeletePreset();
          return handleRemoveSigned();
        }}
        isConfirming={isSaving}
      />
    </div>
  );
}

function ScopeLinks({
  quote,
  companyId,
}: {
  quote: QuoteDetail;
  companyId: string;
}) {
  return (
    <>
      <Link
        href={companyDetailHref(companyId, "datos")}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Building2 />
        Ir a empresa
      </Link>
      {quote.projectId ? (
        <Link
          href={`/app/projects/${quote.projectId}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <FolderKanban />
          Ir a proyecto
        </Link>
      ) : null}
      {quote.ticketId && quote.projectId ? (
        <Link
          href={`/app/projects/${quote.projectId}/tickets/${quote.ticketId}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Ticket />
          Ir a ticket
        </Link>
      ) : null}
    </>
  );
}
