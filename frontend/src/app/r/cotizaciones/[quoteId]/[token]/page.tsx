"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Download, FileWarning } from "lucide-react";
import {
  getPublicQuote,
  type QuoteDetail,
} from "@/components/app/api/quotes";
import { generateQuotePdf } from "@/components/app/quotes/quote-pdf";
import {
  QuotePreviewDocument,
  quoteDetailToPreviewModel,
} from "@/components/app/quotes/quote-preview";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PublicQuoteErrorKind = "not_found" | "expired";

function resolvePublicError(err: unknown): {
  kind: PublicQuoteErrorKind;
  message: string;
} {
  if (err instanceof ApiError) {
    if (
      err.statusCode === 410 ||
      /24\s*horas|expir/i.test(err.message)
    ) {
      return {
        kind: "expired",
        message:
          "Pasaron las 24 horas de validez del enlace de esta cotización.",
      };
    }
  }

  return {
    kind: "not_found",
    message: "Cotización no encontrada.",
  };
}

export default function PublicQuotePage() {
  const params = useParams<{ quoteId: string; token: string }>();
  const quoteId = params.quoteId;
  const token = params.token;

  const [quote, setQuote] = React.useState<QuoteDetail | null>(null);
  const [error, setError] = React.useState<{
    kind: PublicQuoteErrorKind;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPublicQuote(quoteId, token);
        if (!cancelled) setQuote(data);
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setError(resolvePublicError(err));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quoteId, token]);

  const previewModel = React.useMemo(
    () => (quote ? quoteDetailToPreviewModel(quote) : null),
    [quote],
  );

  const handleDownloadPdf = async () => {
    if (!quote || isDownloading) return;
    setIsDownloading(true);
    try {
      await generateQuotePdf(quote);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Cargando cotización…</p>
      </main>
    );
  }

  if (error || !quote || !previewModel) {
    const kind = error?.kind ?? "not_found";
    const title =
      kind === "expired" ? "Enlace vencido" : "Cotización no encontrada";
    const description =
      error?.message ??
      (kind === "expired"
        ? "Pasaron las 24 horas de validez del enlace de esta cotización."
        : "Cotización no encontrada.");

    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="size-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const expiresAt = quote.shareLink?.expiresAt
    ? new Date(quote.shareLink.expiresAt)
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="space-y-3 text-center sm:text-left">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Este enlace es temporal y dura solo 24 horas desde que fue habilitado.
          {expiresAt
            ? ` Vence el ${expiresAt.toLocaleString("es-CL")}.`
            : null}
        </p>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Cotización #{quote.quoteNumber}
          </h1>
          <p className="text-muted-foreground">
            {quote.companyName} ·{" "}
            {quote.documentType === "factura" ? "Factura" : "Boleta"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full text-base font-semibold sm:h-14 sm:text-lg"
          disabled={isDownloading}
          onClick={() => void handleDownloadPdf()}
        >
          <Download className="size-5" />
          {isDownloading ? "Generando PDF…" : "Descargar PDF"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Revisa la vista previa del documento. No se requiere firma.
        </p>
      </div>

      <section className="rounded-xl border bg-muted/30 p-3 sm:p-4">
        <QuotePreviewDocument model={previewModel} />
      </section>
    </main>
  );
}
