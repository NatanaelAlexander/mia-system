"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileStack, FileText, FolderOpen, ScrollText } from "lucide-react";
import { HelpHint } from "@/components/app/shared/help-hint";
import { hasPermission } from "@/components/app/shared/permissions";
import { CompanyQuotesSection } from "@/components/app/quotes/company-quotes-section";
import { useAuth } from "@/hooks/use-auth";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import {
  companyDetailHref,
  type CompanyDocumentsSubTab,
} from "./companies-module";
import { CompanyFilesDriveSection } from "./company-files-drive-section";

interface CompanyDocumentsSectionProps {
  companyId: string;
}

const DOCS_SUBTABS = [
  "cotizaciones",
  "contratos",
  "general",
] as const satisfies readonly CompanyDocumentsSubTab[];

const SUBTAB_HELP: Record<CompanyDocumentsSubTab, string> = {
  cotizaciones:
    "Cotizaciones (boleta o factura) asociadas a esta empresa, un proyecto o un ticket.",
  contratos: "Contratos de la empresa. Próximamente.",
  general:
    "Drive de archivos de la empresa: carpetas, subcarpetas y adjuntos (máx. 50 MB por archivo).",
};

function isDocumentsSubTab(
  value: string | null,
): value is CompanyDocumentsSubTab {
  return (
    typeof value === "string" &&
    (DOCS_SUBTABS as readonly string[]).includes(value)
  );
}

function SubTabLabel({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export function CompanyDocumentsSection({
  companyId,
}: CompanyDocumentsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { claims } = useAuth();

  const canViewQuotes = hasPermission(claims, "quotes:read");
  const canViewContracts = hasPermission(claims, "contracts:read");
  const canViewFiles = hasPermission(claims, "company_files:read");

  const allowedSubTabs = React.useMemo(() => {
    const tabs: CompanyDocumentsSubTab[] = [];
    if (canViewQuotes) tabs.push("cotizaciones");
    if (canViewContracts) tabs.push("contratos");
    if (canViewFiles) tabs.push("general");
    return tabs;
  }, [canViewContracts, canViewFiles, canViewQuotes]);

  const tabFromUrl = searchParams.get("tab");
  const docsFromUrl = searchParams.get("docs");
  const defaultSubTab = allowedSubTabs[0] ?? "cotizaciones";
  const activeSubTab: CompanyDocumentsSubTab = isDocumentsSubTab(docsFromUrl)
    ? allowedSubTabs.includes(docsFromUrl)
      ? docsFromUrl
      : defaultSubTab
    : defaultSubTab;

  // Solo normalizar `docs` mientras la pestaña activa sea Documentos.
  // Si no, al cambiar a Representantes/etc. este efecto reescribía la URL
  // de vuelta a documentos (el panel puede seguir montado).
  React.useEffect(() => {
    if (tabFromUrl !== "documentos") {
      return;
    }

    if (allowedSubTabs.length === 0) {
      return;
    }

    if (!isDocumentsSubTab(docsFromUrl) || !allowedSubTabs.includes(docsFromUrl)) {
      router.replace(
        companyDetailHref(companyId, "documentos", allowedSubTabs[0]),
        { scroll: false },
      );
    }
  }, [allowedSubTabs, companyId, docsFromUrl, router, tabFromUrl]);

  const handleSubTabChange = (value: string | number | null) => {
    if (typeof value !== "string" || !isDocumentsSubTab(value)) {
      return;
    }
    if (!allowedSubTabs.includes(value)) {
      return;
    }
    router.replace(companyDetailHref(companyId, "documentos", value), {
      scroll: false,
    });
  };

  if (allowedSubTabs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tienes permisos para ver documentos de esta empresa.
      </p>
    );
  }

  return (
    <Tabs value={activeSubTab} onValueChange={handleSubTabChange}>
      <TabsList>
        {allowedSubTabs.includes("cotizaciones") ? (
          <TabsTab value="cotizaciones">
            <SubTabLabel icon={FileText} label="Cotizaciones" />
          </TabsTab>
        ) : null}
        {allowedSubTabs.includes("contratos") ? (
          <TabsTab value="contratos">
            <SubTabLabel icon={ScrollText} label="Contratos" />
          </TabsTab>
        ) : null}
        {allowedSubTabs.includes("general") ? (
          <TabsTab value="general">
            <SubTabLabel icon={FolderOpen} label="Drive general" />
          </TabsTab>
        ) : null}
        <TabsIndicator />
      </TabsList>

      {allowedSubTabs.includes("cotizaciones") ? (
        <TabsPanel value="cotizaciones">
          <CompanyQuotesSection companyId={companyId} />
        </TabsPanel>
      ) : null}

      {allowedSubTabs.includes("contratos") ? (
        <TabsPanel value="contratos">
          <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12">
            <div className="inline-flex items-center gap-2 text-sm font-medium">
              <FileStack className="size-4 text-primary" />
              Contratos
              <HelpHint
                label="Qué serán los contratos"
                text={SUBTAB_HELP.contratos}
              />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Próximamente podrás gestionar contratos de la empresa desde aquí.
            </p>
          </div>
        </TabsPanel>
      ) : null}

      {allowedSubTabs.includes("general") ? (
        <TabsPanel value="general">
          <CompanyFilesDriveSection
            companyId={companyId}
            helpText={SUBTAB_HELP.general}
          />
        </TabsPanel>
      ) : null}
    </Tabs>
  );
}
