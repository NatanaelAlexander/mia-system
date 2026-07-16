"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deactivateCompany,
  getCompanyDetail,
  updateCompany,
  type CompanyDetail,
} from "@/components/app/api/companies";
import { formatCompanyStatus } from "@/components/app/shared/format";
import {
  canAccessModule,
  hasPermission,
  isInternalUser,
} from "@/components/app/shared/permissions";
import { preferredSurface } from "@/components/app/shared/surface";
import { projectsModule } from "@/components/app/projects/projects-module";
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

interface CompanyDetailPageProps {
  companyId: string;
}

const COMPANY_TABS = [
  "datos",
  "representantes",
  "usuarios",
  "proyectos",
] as const satisfies readonly CompanyDetailTab[];

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

export function CompanyDetailPage({ companyId }: CompanyDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { claims, isLoading: isAuthLoading } = useAuth();
  const surface = claims ? preferredSurface(claims) : "portal";
  const canAccess = canAccessModule(claims, companiesModule);
  const canEdit =
    isInternalUser(claims) && hasPermission(claims, "companies:update");
  const canDeactivate =
    isInternalUser(claims) && hasPermission(claims, "companies:delete");
  const canViewProjects = canAccessModule(claims, projectsModule);
  const isInternal = isInternalUser(claims);

  const [company, setCompany] = React.useState<CompanyDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = React.useState(false);

  const allowedTabs = React.useMemo(() => {
    const tabs: CompanyDetailTab[] = ["datos"];
    if (isInternal) {
      tabs.push("representantes", "usuarios");
    }
    if (canViewProjects) {
      tabs.push("proyectos");
    }
    return tabs;
  }, [canViewProjects, isInternal]);

  const tabFromUrl = searchParams.get("tab");
  const activeTab: CompanyDetailTab = isCompanyDetailTab(tabFromUrl)
    ? allowedTabs.includes(tabFromUrl)
      ? tabFromUrl
      : "datos"
    : "datos";

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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/app/companies"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft />
            Empresas
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
            <p className="text-sm text-muted-foreground">
              RUT {company.taxId} · {formatCompanyStatus(company.status)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{company.status}</Badge>
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
          <TabsTab value="datos">Datos de la empresa</TabsTab>
          {isInternal ? (
            <>
              <TabsTab value="representantes">Representantes legales</TabsTab>
              <TabsTab value="usuarios">Usuarios vinculados</TabsTab>
            </>
          ) : null}
          {canViewProjects ? (
            <TabsTab value="proyectos">Proyectos activos</TabsTab>
          ) : null}
          <TabsIndicator />
        </TabsList>

        <TabsPanel value="datos">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la empresa</CardTitle>
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

        {isInternal ? (
          <>
            <TabsPanel value="representantes">
              <CompanyRepresentativesSection
                companyId={company.id}
                representativeLinks={company.representativeLinks}
                canManage={canEdit}
                onChanged={loadCompany}
              />
            </TabsPanel>
            <TabsPanel value="usuarios">
              <CompanyUsersSection companyId={company.id} canManage={canEdit} />
            </TabsPanel>
          </>
        ) : null}

        {canViewProjects ? (
          <TabsPanel value="proyectos">
            <CompanyProjectsSection companyId={company.id} surface={surface} />
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
