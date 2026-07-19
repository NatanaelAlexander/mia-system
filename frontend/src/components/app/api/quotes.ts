import { apiFetch, apiFetchDetalle, apiUpload } from "@/lib/api/client";

export type QuoteScope = "company" | "project" | "ticket";
export type QuoteDocumentType = "boleta" | "factura";
export type QuoteStatus = "draft" | "ready" | "sent";
export type QuoteFrequency = "unico" | "mensual" | "anual";
export type PriceInputMode = "gross" | "liquid";
export type QuoteStatusCategory =
  | "workflow"
  | "payment"
  | "exchange"
  | "general";

export interface QuoteIssuer {
  id: string;
  fullName: string;
  taxId: string;
  serviceDescription: string;
  phoneNumber: string | null;
  email: string | null;
  isActive: boolean;
}

export interface QuoteStatusFlag {
  id: string;
  code: string;
  name: string;
  category: QuoteStatusCategory;
  sortOrder: number;
  assignedAt?: string | null;
}

export interface QuoteLineItem {
  id?: string;
  title: string;
  description: string;
  price: number;
  sortOrder?: number;
}

export interface QuoteSection {
  id?: string;
  frequency: QuoteFrequency;
  esCanje: boolean;
  applyTax: boolean;
  priceInputMode: PriceInputMode;
  subtotal?: number;
  taxAmount?: number;
  retentionAmount?: number;
  liquidAmount?: number;
  total?: number;
  items: QuoteLineItem[];
}

export interface QuoteShareLink {
  id: string;
  quoteId: string;
  token: string;
  isEnabled: boolean;
  enabledAt: string | null;
  expiresAt: string | null;
  disabledAt: string | null;
}

export interface QuoteSignedAsset {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface QuoteListItem {
  id: string;
  quoteNumber: number;
  companyId: string;
  companyName: string | null;
  legalRepresentativeId: string;
  issuerId: string;
  scope: QuoteScope;
  projectId: string | null;
  projectName: string | null;
  ticketId: string | null;
  ticketTitle: string | null;
  documentType: QuoteDocumentType;
  pdfLayoutId: string;
  pdfPrimaryColor: string;
  pdfSecondaryColor: string;
  clientVisible: boolean;
  issueDate: string;
  expiresAt: string;
  status: QuoteStatus;
  signedAssetId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  shareEnabled: boolean | null;
  shareExpiresAt: string | null;
  statusFlags: QuoteStatusFlag[];
}

export interface QuoteDetail extends QuoteListItem {
  issuer: QuoteIssuer;
  legalRepresentativeName: string;
  legalRepresentativeTaxId: string;
  companyTaxId: string | null;
  sections: QuoteSection[];
  shareLink: QuoteShareLink | null;
  signedAsset: QuoteSignedAsset | null;
}

export interface QuoteSectionPayload {
  frequency: QuoteFrequency;
  esCanje: boolean;
  applyTax: boolean;
  priceInputMode?: PriceInputMode;
  items: Array<{
    title: string;
    description: string;
    price: number;
  }>;
}

export interface CreateQuotePayload {
  companyId: string;
  legalRepresentativeId: string;
  issuerId: string;
  scope: QuoteScope;
  projectId?: string | null;
  ticketId?: string | null;
  documentType: QuoteDocumentType;
  pdfLayoutId?: string;
  pdfPrimaryColor?: string;
  pdfSecondaryColor?: string;
  clientVisible: boolean;
  issueDate: string;
  expiresAt?: string;
  status?: QuoteStatus;
  sections: QuoteSectionPayload[];
}

export type UpdateQuotePayload = Partial<
  Omit<CreateQuotePayload, "companyId">
>;

export interface ListQuotesFilters {
  companyId?: string;
  projectId?: string;
  ticketId?: string;
  status?: QuoteStatus;
  statusCode?: string;
  documentType?: QuoteDocumentType;
  clientVisible?: boolean;
  issueDateFrom?: string;
  issueDateTo?: string;
}

export function listQuoteIssuers() {
  return apiFetch<QuoteIssuer[]>("/internal/quotes/emisores", {}, true);
}

export function listQuotes(filters: ListQuotesFilters = {}) {
  return apiFetchDetalle<QuoteListItem[]>(
    "/internal/quotes/listar",
    filters,
    true,
  );
}

export function getQuoteDetail(id: string) {
  return apiFetchDetalle<QuoteDetail>(
    "/internal/quotes/detalle",
    { id },
    true,
  );
}

export function createQuote(payload: CreateQuotePayload) {
  return apiFetch<QuoteDetail>("/internal/quotes", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function updateQuote(id: string, payload: UpdateQuotePayload) {
  return apiFetch<QuoteDetail>(`/internal/quotes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function deleteQuote(id: string) {
  return apiFetch<void>(`/internal/quotes/${id}`, {
    method: "DELETE",
  }, true);
}

export function sendQuote(id: string) {
  return apiFetch<QuoteDetail>(`/internal/quotes/${id}/enviar`, {
    method: "POST",
  }, true);
}

export function toggleQuoteShare(id: string, enabled: boolean) {
  return apiFetch<QuoteDetail>(`/internal/quotes/${id}/enlace`, {
    method: "POST",
    body: JSON.stringify({ enabled }),
  }, true);
}

export function listQuoteStatusCatalog() {
  return apiFetch<QuoteStatusFlag[]>("/internal/quotes/estados", {}, true);
}

export function setQuoteStatuses(id: string, statusCodes: string[]) {
  return apiFetch<QuoteDetail>(`/internal/quotes/${id}/estados`, {
    method: "POST",
    body: JSON.stringify({ statusCodes }),
  }, true);
}

export function uploadQuoteSignedDocument(
  id: string,
  file: File,
  displayName?: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  if (displayName?.trim()) {
    formData.append("displayName", displayName.trim());
  }
  return apiUpload<QuoteDetail>(
    `/internal/quotes/${id}/documento-firmado`,
    formData,
    true,
  );
}

export function removeQuoteSignedDocument(id: string) {
  return apiFetch<QuoteDetail>(`/internal/quotes/${id}/documento-firmado`, {
    method: "DELETE",
  }, true);
}

export function getPublicQuote(token: string) {
  return apiFetch<QuoteDetail>(`/public/quotes/${token}`, {}, false);
}

export interface QuotePresetPayload {
  legalRepresentativeId?: string;
  issuerId?: string;
  scope?: QuoteScope;
  projectId?: string | null;
  ticketId?: string | null;
  documentType?: QuoteDocumentType;
  pdfLayoutId?: string;
  pdfPrimaryColor?: string;
  pdfSecondaryColor?: string;
  clientVisible?: boolean;
  sections?: Array<{
    frequency: QuoteFrequency;
    esCanje: boolean;
    applyTax: boolean;
    priceInputMode?: PriceInputMode;
    items: Array<{
      title: string;
      description: string;
      price: number | string;
    }>;
  }>;
}

export interface QuotePreset {
  id: string;
  name: string;
  companyId: string | null;
  createdBy: string;
  payload: QuotePresetPayload;
  createdAt: string;
  updatedAt: string;
}

export function listQuotePresets(companyId?: string) {
  return apiFetchDetalle<QuotePreset[]>(
    "/internal/quotes/presets/listar",
    { companyId },
    true,
  );
}

export function createQuotePreset(payload: {
  name: string;
  companyId?: string | null;
  payload: QuotePresetPayload;
}) {
  return apiFetch<QuotePreset>("/internal/quotes/presets", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function updateQuotePreset(
  id: string,
  payload: {
    name?: string;
    payload?: QuotePresetPayload;
  },
) {
  return apiFetch<QuotePreset>(`/internal/quotes/presets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function deleteQuotePreset(id: string) {
  return apiFetch<void>(`/internal/quotes/presets/${id}`, {
    method: "DELETE",
  }, true);
}
