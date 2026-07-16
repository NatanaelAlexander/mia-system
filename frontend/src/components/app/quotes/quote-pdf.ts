import jsPDF from "jspdf";
import type { QuoteDetail, QuoteSection } from "@/components/app/api/quotes";
import {
  hexToRgb,
  resolveQuotePdfTheme,
} from "@/components/app/quotes/quote-pdf-styles";

const FREQUENCY_LABEL: Record<string, string> = {
  unico: "PAGOS UNITARIOS",
  mensual: "PAGOS MENSUALES",
  anual: "PAGOS ANUALES",
};

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function money(value: number): string {
  return `$${Number(value).toLocaleString("es-CL")}`;
}

export function generateQuotePdf(quote: QuoteDetail): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const theme = resolveQuotePdfTheme({
    layoutId: quote.pdfLayoutId,
    primary: quote.pdfPrimaryColor,
    secondary: quote.pdfSecondaryColor,
  });
  const layout = theme.layoutId;
  const marginX = layout === "minimal" ? 18 : 15;
  let yPosition = 20;

  const grayDark: [number, number, number] = [31, 41, 55];
  const grayBorder: [number, number, number] = [229, 231, 235];
  const grayLight: [number, number, number] = [249, 250, 251];
  const primary = hexToRgb(theme.primary);
  const secondary = hexToRgb(theme.secondary);
  const background = hexToRgb(theme.background);
  const red: [number, number, number] = [220, 38, 38];

  doc.setFillColor(...background);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  const issuer = quote.issuer;
  const docTypeLabel =
    quote.documentType === "factura" ? "Factura" : "Boleta";

  const drawLabelValue = (
    label: string,
    value: string,
    x: number,
    y: number,
    opts?: { align?: "left" | "right"; valueColor?: [number, number, number]; valueSize?: number },
  ) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondary);
    doc.text(label, x, y, opts?.align ? { align: opts.align } : undefined);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(opts?.valueSize ?? 8);
    doc.setTextColor(...(opts?.valueColor ?? grayDark));
    doc.text(value || "-", x, y + 3.5, opts?.align ? { align: opts.align } : undefined);
  };

  if (layout === "banner") {
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 52, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(issuer.fullName, marginX, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      [issuer.taxId, issuer.serviceDescription].filter(Boolean).join(" · "),
      marginX,
      20,
    );
    doc.text(
      [issuer.phoneNumber, issuer.email].filter(Boolean).join(" · "),
      marginX,
      26,
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`COTIZACIÓN #${quote.quoteNumber}`, pageWidth - marginX, 16, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`FECHA: ${formatDate(quote.issueDate)}`, pageWidth - marginX, 26, {
      align: "right",
    });
    doc.text(`CLIENTE: ${quote.companyName || "-"}`, pageWidth - marginX, 32, {
      align: "right",
    });
    doc.text(`DOC: ${docTypeLabel}`, pageWidth - marginX, 38, {
      align: "right",
    });
    doc.setFillColor(...secondary);
    doc.rect(0, 52, pageWidth, 2.5, "F");
    yPosition = 62;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...grayDark);
    doc.text("DESCRIPCIÓN DEL PROYECTO", marginX, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(
      `${quote.legalRepresentativeName || "-"} · RUT ${quote.companyTaxId || "-"} · Validez ${formatDate(quote.expiresAt)}`,
      marginX,
      yPosition + 5,
    );
    yPosition += 14;
  } else if (layout === "informe") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primary);
    doc.text(issuer.fullName, marginX, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(`RUT ${issuer.taxId}`, marginX, 19);
    doc.text(issuer.serviceDescription, marginX, 24);
    doc.text(
      [issuer.phoneNumber, issuer.email].filter(Boolean).join(" · "),
      marginX,
      29,
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...grayDark);
    doc.text(`N° ${quote.quoteNumber}`, pageWidth - marginX, 14, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(formatDate(quote.issueDate), pageWidth - marginX, 20, {
      align: "right",
    });
    doc.text(`Validez ${formatDate(quote.expiresAt)}`, pageWidth - marginX, 25, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...grayDark);
    doc.text("COTIZACIÓN", pageWidth / 2, 42, { align: "center" });

    const infoTop = 48;
    const infoHeight = 36;
    doc.setDrawColor(...grayBorder);
    doc.setLineWidth(0.4);
    doc.rect(marginX, infoTop, pageWidth - marginX * 2, infoHeight, "S");
    doc.setFillColor(...primary);
    doc.rect(marginX, infoTop, pageWidth - marginX * 2, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN", marginX + 3, infoTop + 5);

    drawLabelValue("Empresa", quote.companyName || "-", marginX + 3, infoTop + 13);
    drawLabelValue("RUT", quote.companyTaxId || "-", marginX + 3, infoTop + 22);
    drawLabelValue(
      "Contacto",
      quote.legalRepresentativeName || "-",
      marginX + 55,
      infoTop + 13,
    );
    drawLabelValue(
      "Documento",
      docTypeLabel,
      pageWidth - marginX - 3,
      infoTop + 13,
      { align: "right" },
    );
    drawLabelValue(
      "Emisión",
      formatDate(quote.issueDate),
      pageWidth - marginX - 3,
      infoTop + 22,
      { align: "right" },
    );
    yPosition = infoTop + infoHeight + 8;
  } else if (layout === "dual") {
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("COTIZACIÓN", marginX, 9);
    doc.setFontSize(10);
    doc.text(`N.º ${quote.quoteNumber}`, pageWidth - marginX, 9, {
      align: "right",
    });

    yPosition = 22;
    doc.setFontSize(11);
    doc.setTextColor(...primary);
    doc.text(issuer.fullName, marginX, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(`RUT ${issuer.taxId} · ${issuer.serviceDescription}`, marginX, yPosition + 5);

    drawLabelValue(
      "Emisión",
      formatDate(quote.issueDate),
      pageWidth - marginX,
      yPosition,
      { align: "right" },
    );
    drawLabelValue(
      "Validez",
      formatDate(quote.expiresAt),
      pageWidth - marginX,
      yPosition + 9,
      { align: "right" },
    );

    yPosition += 20;
    const cardW = (pageWidth - marginX * 2 - 6) / 2;
    const cardH = 28;
    const drawPartyCard = (
      title: string,
      lines: string[],
      x: number,
    ) => {
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(...primary);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, yPosition, cardW, cardH, 2, 2, "FD");
      doc.setFillColor(...primary);
      doc.rect(x + 2, yPosition + 3, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...primary);
      doc.text(title, x + 6, yPosition + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...grayDark);
      lines.forEach((line, index) => {
        doc.text(line, x + 3, yPosition + 12 + index * 4);
      });
    };
    drawPartyCard(
      "CLIENTE",
      [
        quote.companyName || "-",
        `RUT ${quote.companyTaxId || "-"}`,
        quote.legalRepresentativeName || "-",
      ],
      marginX,
    );
    drawPartyCard(
      "EMISOR",
      [
        issuer.fullName,
        `RUT ${issuer.taxId}`,
        [issuer.email, issuer.phoneNumber].filter(Boolean).join(" · ") ||
          issuer.serviceDescription,
      ],
      marginX + cardW + 6,
    );
    yPosition += cardH + 8;
  } else if (layout === "editorial") {
    doc.setFillColor(...primary);
    doc.rect(0, 0, 4, pageHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...primary);
    doc.text("COTIZACIÓN", marginX + 2, 18);
    doc.setFontSize(9);
    doc.setTextColor(...grayDark);
    doc.text(`${issuer.fullName} | ${issuer.taxId}`, marginX + 2, 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(issuer.serviceDescription, marginX + 2, 31);
    doc.text(
      [issuer.phoneNumber, issuer.email].filter(Boolean).join(" | "),
      marginX + 2,
      36,
    );

    doc.setDrawColor(...primary);
    doc.setLineWidth(1.2);
    doc.line(pageWidth - 70, 14, pageWidth - 70, 48);
    drawLabelValue(
      "COTIZACIÓN Nº",
      String(quote.quoteNumber),
      pageWidth - marginX,
      16,
      { align: "right", valueColor: primary, valueSize: 14 },
    );
    drawLabelValue(
      "FECHA",
      formatDate(quote.issueDate),
      pageWidth - marginX,
      30,
      { align: "right" },
    );
    drawLabelValue(
      "VALIDEZ",
      formatDate(quote.expiresAt),
      pageWidth - marginX,
      40,
      { align: "right" },
    );

    yPosition = 54;
    doc.setDrawColor(...primary);
    doc.setLineWidth(0.8);
    doc.line(marginX + 2, yPosition, pageWidth - marginX, yPosition);
    yPosition += 8;
    drawLabelValue("Empresa", quote.companyName || "-", marginX + 2, yPosition);
    drawLabelValue("RUT", quote.companyTaxId || "-", marginX + 70, yPosition);
    yPosition += 10;
    drawLabelValue(
      "Representante",
      quote.legalRepresentativeName || "-",
      marginX + 2,
      yPosition,
    );
    drawLabelValue("Documento", docTypeLabel, marginX + 70, yPosition);
    yPosition += 14;
  } else if (layout === "tarjetas") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text("DOCUMENTO COMERCIAL", marginX, 12);
    doc.setFontSize(18);
    doc.setTextColor(...primary);
    doc.text("Cotización", marginX, 20);
    doc.setFillColor(...primary);
    doc.roundedRect(pageWidth - marginX - 28, 10, 28, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text("Nº", pageWidth - marginX - 14, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(String(quote.quoteNumber), pageWidth - marginX - 14, 21, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...grayDark);
    doc.text(`${issuer.fullName} | ${issuer.taxId}`, marginX, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(issuer.serviceDescription, marginX, 35);

    yPosition = 42;
    const cards: Array<{ label: string; value: string }> = [
      { label: "Empresa", value: quote.companyName || "-" },
      { label: "RUT", value: quote.companyTaxId || "-" },
      { label: "Representante", value: quote.legalRepresentativeName || "-" },
      { label: "RUN", value: quote.legalRepresentativeTaxId || "-" },
      { label: "Fecha", value: formatDate(quote.issueDate) },
      { label: "Validez", value: formatDate(quote.expiresAt) },
    ];
    const cardW = (pageWidth - marginX * 2 - 6) / 2;
    const cardH = 14;
    cards.forEach((card, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = marginX + col * (cardW + 6);
      const y = yPosition + row * (cardH + 3);
      doc.setDrawColor(...grayBorder);
      doc.setFillColor(...grayLight);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...secondary);
      doc.text(card.label.toUpperCase(), x + 2, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...grayDark);
      doc.text(card.value, x + 2, y + 10);
    });
    yPosition += 3 * (cardH + 3) + 4;
  } else if (layout === "minimal") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(22);
    doc.setTextColor(...primary);
    doc.text("Cotización", marginX, 20);
    doc.setDrawColor(...grayBorder);
    doc.setLineWidth(0.3);
    doc.line(marginX, 28, pageWidth - marginX, 28);

    yPosition = 36;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...grayDark);
    doc.text(`${issuer.fullName} | ${issuer.taxId}`, marginX, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(issuer.serviceDescription, marginX, yPosition + 5);
    doc.text(
      [issuer.phoneNumber, issuer.email].filter(Boolean).join(" | "),
      marginX,
      yPosition + 10,
    );

    drawLabelValue(
      "Nº",
      String(quote.quoteNumber),
      pageWidth - marginX,
      yPosition,
      { align: "right", valueColor: primary, valueSize: 14 },
    );
    drawLabelValue(
      "Fecha",
      formatDate(quote.issueDate),
      pageWidth - marginX,
      yPosition + 14,
      { align: "right" },
    );
    drawLabelValue(
      "Validez",
      formatDate(quote.expiresAt),
      pageWidth - marginX,
      yPosition + 24,
      { align: "right" },
    );

    yPosition += 40;
    doc.setDrawColor(...grayBorder);
    doc.line(marginX, yPosition, pageWidth - marginX, yPosition);
    yPosition += 8;
    drawLabelValue("Empresa", quote.companyName || "-", marginX, yPosition);
    drawLabelValue("RUT", quote.companyTaxId || "-", marginX + 80, yPosition);
    yPosition += 10;
    drawLabelValue(
      "Representante",
      quote.legalRepresentativeName || "-",
      marginX,
      yPosition,
    );
    drawLabelValue("Documento", docTypeLabel, marginX + 80, yPosition);
    yPosition += 14;
  } else {
    // clasico (default)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...primary);
    doc.text("COTIZACIÓN", marginX, 18);
    doc.setDrawColor(...grayBorder);
    doc.setLineWidth(0.3);
    doc.line(marginX, 21, pageWidth - marginX, 21);

    yPosition = 28;
    doc.setFontSize(9);
    doc.setTextColor(...grayDark);
    doc.text(`${issuer.fullName} | ${issuer.taxId}`, marginX, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(issuer.serviceDescription, marginX, yPosition + 5);
    doc.text(
      [issuer.phoneNumber, issuer.email].filter(Boolean).join(" | "),
      marginX,
      yPosition + 10,
    );

    yPosition += 18;
    const boxW = pageWidth - marginX * 2;
    doc.setDrawColor(...grayBorder);
    doc.setFillColor(...grayLight);
    doc.roundedRect(marginX, yPosition, boxW, 44, 3, 3, "FD");
    drawLabelValue(
      "NOMBRE/RAZÓN SOCIAL",
      quote.companyName || "-",
      marginX + 5,
      yPosition + 7,
    );
    drawLabelValue("R.U.T", quote.companyTaxId || "-", marginX + 5, yPosition + 17);
    drawLabelValue(
      "REPRESENTANTE LEGAL",
      quote.legalRepresentativeName || "-",
      marginX + 5,
      yPosition + 27,
    );
    drawLabelValue(
      "R.U.N REPRESENTANTE LEGAL",
      quote.legalRepresentativeTaxId || "-",
      marginX + 5,
      yPosition + 37,
    );

    const xRight = pageWidth - marginX - 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondary);
    doc.text("COTIZACIÓN Nº", xRight, yPosition + 7, { align: "right" });
    doc.setFontSize(16);
    doc.setTextColor(...primary);
    doc.text(String(quote.quoteNumber), xRight, yPosition + 15, {
      align: "right",
    });
    drawLabelValue(
      "FECHA",
      formatDate(quote.issueDate),
      xRight,
      yPosition + 22,
      { align: "right" },
    );
    drawLabelValue(
      "VALIDEZ",
      formatDate(quote.expiresAt),
      xRight,
      yPosition + 32,
      { align: "right" },
    );
    yPosition += 52;
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(`Documento: ${docTypeLabel}`, marginX, yPosition);
    yPosition += 8;
  }

  if (layout === "tarjetas" || layout === "dual") {
    doc.setFontSize(8);
    doc.setTextColor(...secondary);
    doc.text(`Documento: ${docTypeLabel}`, marginX, yPosition);
    yPosition += 8;
  }

  const drawTable = (section: QuoteSection, startY: number): number => {
    if (!section.items.length) return startY;

    let currentY = startY;
    const baseTitle = FREQUENCY_LABEL[section.frequency] ?? section.frequency;
    const title = section.esCanje ? `${baseTitle} (CANJE)` : baseTitle;
    const contentWidth = pageWidth - marginX * 2;

    if (currentY > pageHeight - 80) {
      doc.addPage();
      doc.setFillColor(...background);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      if (layout === "editorial") {
        doc.setFillColor(...primary);
        doc.rect(0, 0, 4, pageHeight, "F");
      }
      currentY = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...grayDark);
    doc.text(title, marginX, currentY);
    doc.setDrawColor(...primary);
    doc.setLineWidth(layout === "editorial" ? 0.8 : 0.5);
    doc.line(marginX, currentY + 1, marginX + 20, currentY + 1);
    currentY += 8;

    const rowHeights: number[] = [];
    let totalTableHeight = 7;
    section.items.forEach((item) => {
      const lines = doc.splitTextToSize(item.description || "-", 80);
      const rowHeight = Math.max(7, lines.length * 4 + 3);
      rowHeights.push(rowHeight);
      totalTableHeight += rowHeight;
    });

    doc.setDrawColor(...grayBorder);
    doc.setLineWidth(0.3);
    if (layout !== "minimal") {
      doc.roundedRect(marginX, currentY, contentWidth, totalTableHeight, 3, 3, "D");
    }

    if (
      layout === "editorial" ||
      layout === "banner" ||
      layout === "informe" ||
      layout === "dual"
    ) {
      doc.setFillColor(...primary);
      doc.rect(marginX, currentY, contentWidth, 7, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(...grayLight);
      doc.rect(marginX, currentY, contentWidth, 7, "F");
      doc.setTextColor(...secondary);
    }
    doc.line(marginX, currentY + 7, pageWidth - marginX, currentY + 7);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("PROYECTO", marginX + 5, currentY + 4.5);
    doc.text("DESCRIPCIÓN", marginX + 50, currentY + 4.5);
    doc.text("PRECIO", pageWidth - marginX - 5, currentY + 4.5, {
      align: "right",
    });
    currentY += 7;

    section.items.forEach((item, index) => {
      const rowHeight = rowHeights[index];
      const rowStartY = currentY;

      doc.setTextColor(...grayDark);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(item.title, marginX + 5, rowStartY + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...secondary);
      const lines = doc.splitTextToSize(item.description || "-", 80) as string[];
      lines.forEach((line, lineIndex) => {
        doc.text(line, marginX + 50, rowStartY + 4.5 + lineIndex * 4);
      });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...(item.price < 0 ? red : grayDark));
      doc.text(money(item.price), pageWidth - marginX - 5, rowStartY + 4.5, {
        align: "right",
      });

      currentY += rowHeight;
      if (index < section.items.length - 1) {
        doc.setDrawColor(243, 244, 246);
        doc.setLineWidth(0.2);
        doc.line(marginX, currentY, pageWidth - marginX, currentY);
      }
    });

    currentY += 3;
    if (layout !== "minimal") {
      doc.setFillColor(...grayLight);
      doc.roundedRect(marginX, currentY, contentWidth, 6, 2, 2, "F");
    }
    doc.setTextColor(...secondary);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Sub-Total", marginX + 5, currentY + 4);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...grayDark);
    doc.text(money(section.subtotal ?? 0), pageWidth - marginX - 5, currentY + 4, {
      align: "right",
    });
    currentY += 9;

    if (quote.documentType === "boleta") {
      doc.setTextColor(...secondary);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      if (section.applyTax && (section.retentionAmount ?? 0) > 0) {
        doc.text(
          `Retención (15,25%): ${money(section.retentionAmount ?? 0)} · Líquido: ${money(section.liquidAmount ?? 0)}`,
          marginX + 5,
          currentY,
        );
      } else {
        doc.text(
          "El monto indicado corresponde al valor líquido a recibir; la retención legal deberá ser asumida por el pagador.",
          marginX + 5,
          currentY,
        );
      }
      currentY += 5;
    }

    if (
      quote.documentType === "factura" &&
      section.applyTax &&
      (section.taxAmount ?? 0) > 0
    ) {
      if (layout !== "minimal") {
        doc.setFillColor(...grayLight);
        doc.roundedRect(marginX, currentY, contentWidth, 6, 2, 2, "F");
      }
      doc.setTextColor(...secondary);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("IVA (19%)", marginX + 5, currentY + 4);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...grayDark);
      doc.text(money(section.taxAmount ?? 0), pageWidth - marginX - 5, currentY + 4, {
        align: "right",
      });
      currentY += 9;
    }

    if (layout === "minimal") {
      doc.setDrawColor(...primary);
      doc.setLineWidth(0.6);
      doc.roundedRect(marginX, currentY, contentWidth, 9, 2, 2, "D");
      doc.setTextColor(...primary);
    } else {
      doc.setFillColor(...primary);
      doc.roundedRect(marginX, currentY, contentWidth, 9, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Total", marginX + 5, currentY + 6);
    doc.setFontSize(12);
    doc.text(money(section.total ?? 0), pageWidth - marginX - 5, currentY + 6, {
      align: "right",
    });

    return currentY + 18;
  };

  for (const section of quote.sections) {
    yPosition = drawTable(section, yPosition);
  }

  const footerY = pageHeight - 20;
  doc.setDrawColor(...grayBorder);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 5, pageWidth - marginX, footerY - 5);
  doc.setTextColor(...secondary);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por su preferencia.", pageWidth / 2, footerY, {
    align: "center",
  });

  const safeName = (quote.companyName || "cotizacion").replace(/\s+/g, "_");
  doc.save(`Cotizacion_${safeName}_${Date.now()}.pdf`);
}
