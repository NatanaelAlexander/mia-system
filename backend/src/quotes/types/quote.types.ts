export enum QuoteScope {
  COMPANY = 'company',
  PROJECT = 'project',
  TICKET = 'ticket',
}

export enum QuoteDocumentType {
  BOLETA = 'boleta',
  FACTURA = 'factura',
}

export enum QuoteStatus {
  READY = 'ready',
  SENT = 'sent',
}

export enum QuoteFrequency {
  UNICO = 'unico',
  MENSUAL = 'mensual',
  ANUAL = 'anual',
}

export enum PriceInputMode {
  GROSS = 'gross',
  LIQUID = 'liquid',
}

export interface QuoteIssuer {
  id: string;
  fullName: string;
  taxId: string;
  serviceDescription: string;
  phoneNumber: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteLineItem {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  price: number;
  sortOrder: number;
}

export interface QuoteSection {
  id: string;
  quoteId: string;
  frequency: QuoteFrequency;
  esCanje: boolean;
  applyTax: boolean;
  priceInputMode: PriceInputMode;
  subtotal: number;
  taxAmount: number;
  retentionAmount: number;
  liquidAmount: number;
  total: number;
  sortOrder: number;
  items: QuoteLineItem[];
}

export interface QuoteShareLink {
  id: string;
  quoteId: string;
  token: string;
  isEnabled: boolean;
  enabledAt: Date | null;
  expiresAt: Date | null;
  disabledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteStatusFlag {
  id: string;
  code: string;
  name: string;
  category: 'workflow' | 'payment' | 'exchange' | 'general';
  sortOrder: number;
  assignedAt?: Date | string | null;
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
  createdAt: Date;
  updatedAt: Date;
  shareEnabled: boolean | null;
  shareExpiresAt: Date | null;
  statusFlags: QuoteStatusFlag[];
}

export interface QuoteDetail extends QuoteListItem {
  issuer: QuoteIssuer;
  legalRepresentativeName: string;
  legalRepresentativeTaxId: string;
  companyTaxId: string | null;
  sections: QuoteSection[];
  shareLink: QuoteShareLink | null;
  signedAsset: {
    id: string;
    fileName: string;
    mimeType: string | null;
    fileSize: number | null;
    createdAt: Date;
  } | null;
}

export interface QuotePreset {
  id: string;
  name: string;
  companyId: string | null;
  createdBy: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
