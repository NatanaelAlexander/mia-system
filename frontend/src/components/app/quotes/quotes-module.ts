import { FileText } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const quotesModule = {
  title: "Cotizaciones",
  href: "/app/companies",
  icon: FileText,
  requiredPermission: "quotes:read",
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof FileText;
};

export function companyQuoteHref(companyId: string, quoteId?: string): string {
  if (!quoteId) {
    return `/app/companies/${companyId}/quotes/new`;
  }
  return `/app/companies/${companyId}/quotes/${quoteId}`;
}

export function publicQuoteHref(quoteId: string, token: string): string {
  return `/r/cotizaciones/${quoteId}/${token}`;
}
