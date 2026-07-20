"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  FolderKanban,
  IdCard,
  Scale,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  deactivateCompany,
  getCompanyDetail,
  updateCompany,
  type CompanyDetail,
  type CompanyStatus,
} from "@/components/app/api/companies";
import { formatCompanyStatus } from "@/components/app/shared/format";
import { HelpHint } from "@/components/app/shared/help-hint";
import {
  canAccessModule,
  hasPermission,
  isInternalUser,
  isScopedAdmin,
  isSuperAdmin,
} from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { projectsModule } from "@/components/app/projects/projects-module";
import { quotesModule } from "@/components/app/quotes/quotes-module";
import { ErrorState } from "@/components/app/shared/list-states";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import {
  companiesModule,
  companyDetailHref,
  type CompanyDetailTab,
} from "./companies-module";
import {
  CompanyForm,
  toCompanyFormValues,
  toCompanyPayload,
  type CompanyFormValues,
  type CompanyFormSubmitMeta,
} from "./company-form";
import { CompanyRepresentativesSection } from "./company-representatives-section";
import { CompanyUsersSection } from "./company-users-section";
import { CompanyProjectsSection } from "./company-projects-section";
import { CompanyQuotesSection } from "@/components/app/quotes/company-quotes-section";

interface CompanyDetailPageProps {
  companyId: string;
}

const COMPANY_TABS = [
  "datos",
  "representantes",
  "usuarios",
  "proyectos",
  "cotizaciones",
] as const satisfies readonly CompanyDetailTab[];

const STATUS_HELP: Record<CompanyStatus, string> = {
  active:
    "Empresa operativa. Puede tener proyectos activos, usuarios vinculados y tickets en curso.",
  inactive:
    "Empresa deshabilitada. No se usa en la operación diaria; se mantiene el historial.",
};

const TAB_HELP: Record<CompanyDetailTab, string> = {
  datos:
    "Información general de la empresa: RUT, contacto, dirección y estado.",
  representantes:
    "Personas naturales con facultades legales para representar a la empresa ante terceros.",
  usuarios:
    "Cuentas del sistema vinculadas a esta empresa. Pueden acceder al portal o a la operación según su rol.",
  proyectos:
    "Proyectos asociados a esta empresa. Puedes filtrar por activos, inactivos o completados.",
  cotizaciones:
    "Cotizaciones (boleta o factura) asociadas a esta empresa, un proyecto o un ticket. Solo superAdmin.",
};

function isCompanyDetailTab(value: string | null): value is CompanyDetailTab {
  return (
    typeof value === "string" &&
    (COMPANY_TABS as readonly string[]).includes(value)
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

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

export function CompanyDetailPage({ companyId }: CompanyDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const canAccess = canAccessModule(claims, companiesModule);
  const canEdit =
    isInternalUser(claims) &&
    isSuperAdmin(claims) &&
    hasPermission(claims, "companies:update");
  const canDeactivate =
    isInternalUser(claims) &&
    isSuperAdmin(claims) &&
    hasPermission(claims, "companies:delete");
  const canViewProjects = canAccessModule(claims, projectsModule);
  const canViewQuotes = canAccessModule(claims, quotesModule);
  const isInternal = isInternalUser(claims);
  const scopedAdmin = isScopedAdmin(claims);

  const [company, setCompany] = React.useState<CompanyDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = React.useState(false);

  const allowedTabs = React.useMemo(() => {
    if (scopedAdmin) {
      return canViewProjects
        ? (["proyectos"] as CompanyDetailTab[])
        : ([] as CompanyDetailTab[]);
    }

    const tabs: CompanyDetailTab[] = ["datos"];
    if (isInternal) {
      tabs.push("representantes", "usuarios");
    }
    if (canViewProjects) {
      tabs.push("proyectos");
    }
    if (canViewQuotes) {
      tabs.push("cotizaciones");
    }
    return tabs;
  }, [canViewProjects, canViewQuotes, isInternal, scopedAdmin]);

  const tabFromUrl = searchParams.get("tab");
  const defaultTab: CompanyDetailTab = scopedAdmin ? "proyectos" : "datos";
  const activeTab: CompanyDetailTab = isCompanyDetailTab(tabFromUrl)
    ? allowedTabs.includes(tabFromUrl)
      ? tabFromUrl
      : defaultTab
    : defaultTab;

  const handleTabChange = (value: string | number | null) => {
    if (typeof value !== "string" || !isCompanyDetailTab(value)) {
      return;
    }

    if (!allowedTabs.includes(value)) {
      return;
    }

    router.replace(companyDetailHref(companyId, value), { scroll: false });
  };

  const loadCompany = React.useCallback(async () => {
    if (!claims || !canAccess) {
      setCompany(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getCompanyDetail(surface, companyId);
      setCompany(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "No se pudo cargar la empresa.";
      setErrorMessage(message);
      setCompany(null);
    } finally {
      setIsLoading(false);
    }
  }, [claims, canAccess, companyId, surface]);

  React.useEffect(() => {
    if (!isAuthLoading) {
      void loadCompany();
    }
  }, [isAuthLoading, loadCompany]);

  const handleSubmit = async (
    values: CompanyFormValues,
    { dirtyFields }: CompanyFormSubmitMeta,
  ) => {
    if (!canEdit) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = toCompanyPayload(values);
      if (!dirtyFields.taxId) {
        delete payload.taxId;
      }

      const updated = await updateCompany(companyId, {
        ...payload,
        email: values.email?.trim() || null,
        phoneNumber: values.phoneNumber?.trim() || null,
        address: values.address?.trim() || null,
      });
      setCompany((current) =>
        current ? { ...current, ...updated } : current,
      );
      toast.success("Empresa actualizada");
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
    if (!canDeactivate || !company) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deactivateCompany(companyId);
      toast.success("Empresa desactivada");
      setDeactivateConfirmOpen(false);
      router.push("/app/companies");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo desactivar la empresa.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return <DetailSkeleton />;
  }

  if (!canAccess || errorMessage || !company) {
    return (
      <div className="space-y-4">
        <Link
          href="/app/companies"
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft />
          Volver
        </Link>
        <ErrorState
          message={errorMessage ?? "Empresa no disponible."}
          onRetry={loadCompany}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/app/companies"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft />
            Empresas
          </Link>
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Building2 className="size-6 shrink-0 text-primary" />
              {company.name}
            </h1>
            <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <IdCard className="size-3.5" />
                RUT {company.taxId}
              </span>
              <span aria-hidden>·</span>
              <span>{formatCompanyStatus(company.status)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <Badge
              variant={company.status === "active" ? "secondary" : "outline"}
            >
              {formatCompanyStatus(company.status)}
            </Badge>
            <HelpHint
              label={`Qué significa ${formatCompanyStatus(company.status)}`}
              text={STATUS_HELP[company.status]}
            />
          </span>
          {canDeactivate && company.status === "active" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setDeactivateConfirmOpen(true)}
            >
              <Trash2 />
              Desactivar
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {allowedTabs.includes("datos") ? (
            <TabsTab value="datos">
              <TabLabel
                icon={Building2}
                label="Datos de la empresa"
                shortLabel="Datos"
              />
            </TabsTab>
          ) : null}
          {allowedTabs.includes("representantes") ? (
            <TabsTab value="representantes">
              <TabLabel
                icon={Scale}
                label="Representantes legales"
                shortLabel="Representantes"
              />
            </TabsTab>
          ) : null}
          {allowedTabs.includes("usuarios") ? (
            <TabsTab value="usuarios">
              <TabLabel
                icon={Users}
                label="Usuarios vinculados"
                shortLabel="Usuarios"
              />
            </TabsTab>
          ) : null}
          {allowedTabs.includes("proyectos") ? (
            <TabsTab value="proyectos">
              <TabLabel
                icon={FolderKanban}
                label="Proyectos"
                shortLabel="Proyectos"
              />
            </TabsTab>
          ) : null}
          {allowedTabs.includes("cotizaciones") ? (
            <TabsTab value="cotizaciones">
              <TabLabel
                icon={FileText}
                label="Cotizaciones"
                shortLabel="Cotizaciones"
              />
            </TabsTab>
          ) : null}
          <TabsIndicator />
        </TabsList>

        {allowedTabs.includes("datos") ? (
        <TabsPanel value="datos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Datos de la empresa
                <HelpHint
                  label="Qué son los datos de la empresa"
                  text={TAB_HELP.datos}
                />
              </CardTitle>
              <CardDescription>
                {canEdit
                  ? "Edita la información general de la empresa."
                  : "Vista de solo lectura."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyForm
                mode="edit"
                defaultValues={toCompanyFormValues(company)}
                onSubmit={handleSubmit}
                readOnly={!canEdit}
                isSubmitting={isSubmitting}
                submitLabel="Guardar cambios"
              />
            </CardContent>
          </Card>
        </TabsPanel>
        ) : null}

        {allowedTabs.includes("representantes") ? (
            <TabsPanel value="representantes">
              <CompanyRepresentativesSection
                companyId={company.id}
                representativeLinks={company.representativeLinks}
                canManage={canEdit}
                onChanged={loadCompany}
              />
            </TabsPanel>
        ) : null}
        {allowedTabs.includes("usuarios") ? (
            <TabsPanel value="usuarios">
              <CompanyUsersSection companyId={company.id} canManage={canEdit} />
            </TabsPanel>
        ) : null}

        {allowedTabs.includes("proyectos") ? (
          <TabsPanel value="proyectos">
            <CompanyProjectsSection companyId={company.id} surface={surface} />
          </TabsPanel>
        ) : null}

        {allowedTabs.includes("cotizaciones") ? (
          <TabsPanel value="cotizaciones">
            <CompanyQuotesSection companyId={company.id} />
          </TabsPanel>
        ) : null}
      </Tabs>

      <ConfirmDialog
        open={deactivateConfirmOpen}
        onOpenChange={setDeactivateConfirmOpen}
        title="Desactivar empresa"
        description={`¿Desactivar la empresa "${company.name}"? No se eliminará el registro; solo dejará de estar activa.`}
        confirmLabel="Desactivar"
        onConfirm={handleDeactivate}
        isConfirming={isSubmitting}
      />
    </div>
  );
}
