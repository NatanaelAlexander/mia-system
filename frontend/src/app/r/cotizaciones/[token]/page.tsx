"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Download, FileWarning } from "lucide-react";
import {
  getPublicQuote,
  type QuoteDetail,
} from "@/components/app/api/quotes";
import { generateQuotePdf } from "@/components/app/quotes/quote-pdf";
import { formatClp } from "@/components/app/quotes/quotes-tax";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PublicQuotePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [quote, setQuote] = React.useState<QuoteDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPublicQuote(token);
        if (!cancelled) setQuote(data);
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setError(
            err instanceof ApiError
              ? err.message
              : "El enlace no es válido o ha expirado.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Cargando cotización…</p>
      </main>
    );
  }

  if (error || !quote) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="size-5" />
              Enlace no disponible
            </CardTitle>
            <CardDescription>
              {error ??
                "Este enlace solo es válido durante 24 horas o fue deshabilitado."}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const expiresAt = quote.shareLink?.expiresAt
    ? new Date(quote.shareLink.expiresAt)
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Este enlace es temporal y dura solo 24 horas desde que fue habilitado.
          {expiresAt
            ? ` Vence el ${expiresAt.toLocaleString("es-CL")}.`
            : null}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cotización #{quote.quoteNumber}
        </h1>
        <p className="text-muted-foreground">
          {quote.companyName} ·{" "}
          {quote.documentType === "factura" ? "Factura" : "Boleta"}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Revisión del documento</CardTitle>
            <CardDescription>
              Puedes descargar el PDF para revisarlo. No se requiere firma.
            </CardDescription>
          </div>
          <Button type="button" onClick={() => generateQuotePdf(quote)}>
            <Download />
            Descargar PDF
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Fecha: </span>
              {quote.issueDate}
            </p>
            <p>
              <span className="text-muted-foreground">Validez: </span>
              {quote.expiresAt}
            </p>
            <p>
              <span className="text-muted-foreground">Representante: </span>
              {quote.legalRepresentativeName}
            </p>
            <p>
              <span className="text-muted-foreground">Emisor: </span>
              {quote.issuer.fullName}
            </p>
          </div>

          {quote.sections.map((section) => (
            <div key={section.frequency} className="rounded-lg border p-3">
              <p className="mb-2 font-medium capitalize">
                {section.frequency}
                {section.esCanje ? " (canje)" : ""}
              </p>
              <ul className="space-y-1 text-sm">
                {section.items.map((item, index) => (
                  <li
                    key={`${section.frequency}-${index}`}
                    className="flex justify-between gap-4"
                  >
                    <span>
                      {item.title}
                      {item.description ? ` — ${item.description}` : ""}
                    </span>
                    <span>{formatClp(item.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t pt-2 text-sm font-medium">
                <span>Total</span>
                <span>{formatClp(section.total ?? 0)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
