import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AssetsService } from '../assets/assets.service';
import { AuditAction } from '../audit/types/audit.types';
import { AuditService } from '../audit/audit.service';
import { CompaniesService } from '../companies/companies.service';
import { DatabaseService } from '../common/database/database.service';
import { QueryResult, QueryResultRow } from 'pg';
import {
  CreateQuoteDto,
  FilterQuotesDto,
  QuoteSectionDto,
  UpdateQuoteDto,
} from './dto/quote.dto';
import {
  AlcanceCotizacionInvalidoException,
  CotizacionNoEncontradaException,
  CotizacionNoVisibleClienteException,
  DocumentoFirmadoNoEncontradoException,
  DocumentoFirmadoYaExisteException,
  EmisorNoEncontradoException,
  EnlaceCotizacionInvalidoException,
  EstadoCotizacionInvalidoException,
  PresetCotizacionNoEncontradoException,
  RepresentanteNoVinculadoException,
  SeccionCotizacionVaciaException,
} from './exceptions/quotes.exceptions';
import {
  SQL_ASSIGN_STATUS,
  SQL_CLEAR_QUOTE_STATUSES,
  SQL_CLEAR_SIGNED_ASSET,
  SQL_DELETE_PRESET,
  SQL_DELETE_QUOTE,
  SQL_DELETE_QUOTE_SECTIONS,
  SQL_FIND_ACTIVE_ISSUERS,
  SQL_FIND_COMPANY_PORTAL_USER_IDS,
  SQL_FIND_ISSUER_BY_ID,
  SQL_FIND_ITEMS_BY_SECTION_IDS,
  SQL_FIND_LEGAL_REP_FOR_COMPANY,
  SQL_FIND_PRESET_BY_ID,
  SQL_FIND_PRESETS,
  SQL_FIND_PROJECT_FOR_COMPANY,
  SQL_FIND_QUOTE_BY_ID,
  SQL_FIND_QUOTES_FILTERED,
  SQL_FIND_SECTIONS_BY_QUOTE,
  SQL_FIND_SHARE_BY_QUOTE,
  SQL_FIND_SHARE_BY_TOKEN,
  SQL_FIND_SIGNED_ASSET,
  SQL_FIND_STATUS_BY_CODE,
  SQL_FIND_STATUS_CATALOG,
  SQL_FIND_STATUSES_BY_QUOTE_IDS,
  SQL_FIND_TICKET_CHAIN,
  SQL_INSERT_LINE_ITEM,
  SQL_INSERT_PRESET,
  SQL_INSERT_QUOTE,
  SQL_INSERT_QUOTE_NOTIFICATION,
  SQL_INSERT_SECTION,
  SQL_QUOTE_DETAIL_EXTRAS,
  SQL_SET_SIGNED_ASSET,
  SQL_UPDATE_PRESET,
  SQL_UPSERT_SHARE_LINK,
} from './queries/quotes.queries';
import { calculateSectionTotals } from './quotes-tax.util';
import {
  PriceInputMode,
  QuoteDetail,
  QuoteDocumentType,
  QuoteFrequency,
  QuoteIssuer,
  QuoteLineItem,
  QuoteListItem,
  QuotePreset,
  QuoteScope,
  QuoteSection,
  QuoteShareLink,
  QuoteStatus,
  QuoteStatusFlag,
} from './types/quote.types';
import {
  CreateQuotePresetDto,
  UpdateQuotePresetDto,
} from './dto/quote-preset.dto';
const AUDIT_TABLE = 'quotes';
const SHARE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_COMMERCIAL_STATUS = 'creado';

type DbQuery = <R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) => Promise<QueryResult<R>>;

@Injectable()
export class QuotesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
    private readonly companiesService: CompaniesService,
    private readonly assetsService: AssetsService,
  ) {}

  async listStatusCatalog(actorUserId: string): Promise<QuoteStatusFlag[]> {
    const { rows } = await this.db.query<QuoteStatusFlag>(
      SQL_FIND_STATUS_CATALOG,
    );
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.READ,
      tableName: 'quote_status_catalog',
      recordId: null,
      newValues: { scope: 'list', resultCount: rows.length },
    });
    return rows;
  }
  async listIssuers(actorUserId: string): Promise<QuoteIssuer[]> {
    const { rows } = await this.db.query<QuoteIssuer>(SQL_FIND_ACTIVE_ISSUERS);
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.READ,
      tableName: 'quote_issuers',
      recordId: null,
      newValues: { scope: 'list', resultCount: rows.length },
    });
    return rows;
  }

  async findAllFiltered(
    actorUserId: string,
    filters: FilterQuotesDto = {},
  ): Promise<QuoteListItem[]> {
    const { rows } = await this.db.query<Omit<QuoteListItem, 'statusFlags'>>(
      SQL_FIND_QUOTES_FILTERED,
      [
        filters.companyId ?? null,
        filters.projectId ?? null,
        filters.ticketId ?? null,
        filters.status ?? null,
        filters.documentType ?? null,
        filters.clientVisible ?? null,
        filters.statusCode?.trim() || null,
        filters.issueDateFrom ?? null,
        filters.issueDateTo ?? null,
      ],
    );

    const withFlags = await this.attachStatusFlags(rows);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.READ,
      tableName: AUDIT_TABLE,
      recordId: null,
      newValues: {
        scope: 'list_filtered',
        filters,
        resultCount: withFlags.length,
      },
    });

    return withFlags;
  }

  async findById(actorUserId: string, id: string): Promise<QuoteDetail> {
    const detail = await this.loadDetail(id);
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.READ,
      tableName: AUDIT_TABLE,
      recordId: id,
      newValues: { scope: 'detail' },
    });
    return detail;
  }

  async create(actorUserId: string, dto: CreateQuoteDto): Promise<QuoteDetail> {
    this.assertHasItems(dto.sections);
    await this.companiesService.findById(actorUserId, dto.companyId);
    await this.assertIssuer(dto.issuerId);
    await this.assertLegalRep(dto.companyId, dto.legalRepresentativeId);

    const scopeIds = await this.resolveScope(
      dto.companyId,
      dto.scope,
      dto.projectId,
      dto.ticketId,
    );

    const expiresAt = dto.expiresAt ?? this.addDays(dto.issueDate, 30);
    const status = dto.status ?? QuoteStatus.DRAFT;

    const quoteId = await this.db.transaction(async (query) => {
      const { rows } = await query<{ id: string }>(SQL_INSERT_QUOTE, [
        dto.companyId,
        dto.legalRepresentativeId,
        dto.issuerId,
        dto.scope,
        scopeIds.projectId,
        scopeIds.ticketId,
        dto.documentType,
        dto.pdfLayoutId ?? 'clasico',
        dto.pdfPrimaryColor ?? '#2563EB',
        dto.pdfSecondaryColor ?? '#6B7280',
        dto.clientVisible,
        dto.issueDate,
        expiresAt,
        status,
        actorUserId,
      ]);

      const id = rows[0].id;
      await this.persistSections(query, id, dto.documentType, dto.sections);
      return id;
    });

    await this.assignStatusCode(
      quoteId,
      dto.statusCode?.trim() || DEFAULT_COMMERCIAL_STATUS,
      actorUserId,
    );

    const withStatus = await this.loadDetail(quoteId);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: AUDIT_TABLE,
      recordId: quoteId,
      newValues: this.asJson(withStatus),
    });

    return withStatus;
  }

  async update(
    actorUserId: string,
    id: string,
    dto: UpdateQuoteDto,
  ): Promise<QuoteDetail> {
    const previous = await this.loadDetail(id);

    if (dto.sections) {
      this.assertHasItems(dto.sections);
    }

    const companyId = previous.companyId;
    const legalRepresentativeId =
      dto.legalRepresentativeId ?? previous.legalRepresentativeId;
    const issuerId = dto.issuerId ?? previous.issuerId;
    const scope = dto.scope ?? previous.scope;
    const documentType = dto.documentType ?? previous.documentType;
    const pdfLayoutId = dto.pdfLayoutId ?? previous.pdfLayoutId ?? 'clasico';
    const pdfPrimaryColor =
      dto.pdfPrimaryColor ?? previous.pdfPrimaryColor ?? '#2563EB';
    const pdfSecondaryColor =
      dto.pdfSecondaryColor ?? previous.pdfSecondaryColor ?? '#6B7280';
    const clientVisible =
      dto.clientVisible !== undefined ? dto.clientVisible : previous.clientVisible;
    const issueDate = dto.issueDate ?? previous.issueDate;
    const expiresAt = dto.expiresAt ?? previous.expiresAt;
    const status = dto.status ?? previous.status;

    if (dto.legalRepresentativeId) {
      await this.assertLegalRep(companyId, legalRepresentativeId);
    }
    if (dto.issuerId) {
      await this.assertIssuer(issuerId);
    }

    const projectId =
      dto.projectId !== undefined ? dto.projectId : previous.projectId;
    const ticketId =
      dto.ticketId !== undefined ? dto.ticketId : previous.ticketId;

    const scopeIds = await this.resolveScope(
      companyId,
      scope,
      projectId,
      ticketId,
    );

    await this.db.transaction(async (query) => {
      await query(
        `UPDATE quotes SET
          legal_representative_id = $1,
          issuer_id = $2,
          scope = $3,
          project_id = $4,
          ticket_id = $5,
          document_type = $6,
          pdf_layout_id = $7,
          pdf_primary_color = $8,
          pdf_secondary_color = $9,
          client_visible = $10,
          issue_date = $11,
          expires_at = $12,
          status = $13,
          updated_at = NOW()
         WHERE id = $14`,
        [
          legalRepresentativeId,
          issuerId,
          scope,
          scopeIds.projectId,
          scopeIds.ticketId,
          documentType,
          pdfLayoutId,
          pdfPrimaryColor,
          pdfSecondaryColor,
          clientVisible,
          issueDate,
          expiresAt,
          status,
          id,
        ],
      );

      if (dto.sections) {
        await query(SQL_DELETE_QUOTE_SECTIONS, [id]);
        await this.persistSections(query, id, documentType, dto.sections);
      }

      if (previous.clientVisible && !clientVisible) {
        await this.disableShareInTx(
          query,
          id,
          previous.shareLink?.token ?? null,
        );
      }
    });

    if (dto.statusCode?.trim()) {
      await this.assignStatusCode(id, dto.statusCode.trim(), actorUserId);
    } else if ((previous.statusFlags?.length ?? 0) === 0) {
      await this.assignStatusCode(
        id,
        DEFAULT_COMMERCIAL_STATUS,
        actorUserId,
      );
    }

    const detail = await this.loadDetail(id);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(detail),
    });

    return detail;
  }

  async remove(actorUserId: string, id: string): Promise<void> {
    const previous = await this.loadDetail(id);
    const { rowCount } = await this.db.query(SQL_DELETE_QUOTE, [id]);
    if (!rowCount) {
      throw new CotizacionNoEncontradaException();
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.SOFT_DELETE,
      tableName: AUDIT_TABLE,
      recordId: id,
      oldValues: this.asJson(previous),
    });
  }

  async send(actorUserId: string, id: string): Promise<QuoteDetail> {
    const quote = await this.loadDetail(id);
    if (!quote.clientVisible) {
      throw new CotizacionNoVisibleClienteException();
    }

    await this.enableShare(id, quote.shareLink?.token ?? null);
    await this.db.query(
      `UPDATE quotes SET status = $1, updated_at = NOW() WHERE id = $2`,
      [QuoteStatus.SENT, id],
    );

    const detail = await this.loadDetail(id);
    await this.assignStatusCode(id, 'enviado', actorUserId);
    await this.notifyPortalUsers(actorUserId, await this.loadDetail(id));

    const sent = await this.loadDetail(id);
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE,
      recordId: id,
      newValues: { scope: 'send', shareExpiresAt: sent.shareLink?.expiresAt },
    });
    return sent;
  }

  async toggleShare(
    actorUserId: string,
    id: string,
    enabled: boolean,
  ): Promise<QuoteDetail> {
    const quote = await this.loadDetail(id);

    if (enabled) {
      if (!quote.clientVisible) {
        throw new CotizacionNoVisibleClienteException();
      }
      await this.enableShare(id, quote.shareLink?.token ?? null);
    } else {
      await this.disableShare(id, quote.shareLink?.token ?? null);
    }

    const detail = await this.loadDetail(id);
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE,
      recordId: id,
      newValues: { scope: 'toggle_share', enabled },
    });
    return detail;
  }

  async findByPublicToken(token: string): Promise<QuoteDetail> {
    const { rows } = await this.db.query<
      QuoteShareLink & { clientVisible: boolean }
    >(SQL_FIND_SHARE_BY_TOKEN, [token]);

    const share = rows[0];
    if (!share || !share.clientVisible || !share.isEnabled || !share.expiresAt) {
      throw new EnlaceCotizacionInvalidoException();
    }

    if (new Date(share.expiresAt).getTime() <= Date.now()) {
      throw new EnlaceCotizacionInvalidoException(
        'El enlace de la cotización ha expirado (válido 24 horas)',
      );
    }

    await this.assignStatusCode(share.quoteId, 'revisado_cliente', null);
    return this.loadDetail(share.quoteId);
  }

  async setStatuses(
    actorUserId: string,
    id: string,
    statusCode: string,
  ): Promise<QuoteDetail> {
    await this.loadDetail(id);
    const code = statusCode.trim() || DEFAULT_COMMERCIAL_STATUS;
    await this.assignStatusCode(id, code, actorUserId);

    if (code === 'enviado') {
      await this.db.query(
        `UPDATE quotes SET status = $1, updated_at = NOW() WHERE id = $2`,
        [QuoteStatus.SENT, id],
      );
    }

    const detail = await this.loadDetail(id);
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE,
      recordId: id,
      newValues: { scope: 'set_status', statusCode: code },
    });
    return detail;
  }

  async uploadSignedDocument(
    actorUserId: string,
    quoteId: string,
    file: Express.Multer.File,
    displayName?: string,
  ): Promise<QuoteDetail> {
    const quote = await this.loadDetail(quoteId);
    if (quote.signedAssetId) {
      throw new DocumentoFirmadoYaExisteException();
    }

    const asset = await this.assetsService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      ownerType: 'quote',
      ownerId: quoteId,
      uploadedById: actorUserId,
      displayFileName: displayName,
    });

    await this.db.query(SQL_SET_SIGNED_ASSET, [quoteId, asset.id]);

    const detail = await this.loadDetail(quoteId);
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE,
      recordId: quoteId,
      newValues: { scope: 'upload_signed', assetId: asset.id },
    });
    return detail;
  }

  async removeSignedDocument(
    actorUserId: string,
    quoteId: string,
  ): Promise<QuoteDetail> {
    const quote = await this.loadDetail(quoteId);
    if (!quote.signedAssetId) {
      throw new DocumentoFirmadoNoEncontradoException();
    }

    const assetId = quote.signedAssetId;
    await this.db.query(SQL_CLEAR_SIGNED_ASSET, [quoteId]);
    await this.assetsService.delete(assetId).catch(() => undefined);

    const detail = await this.loadDetail(quoteId);
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE,
      recordId: quoteId,
      oldValues: { signedAssetId: assetId },
      newValues: { scope: 'remove_signed' },
    });
    return detail;
  }

  private async loadDetail(id: string): Promise<QuoteDetail> {
    const { rows } = await this.db.query<Omit<QuoteListItem, 'statusFlags'>>(
      SQL_FIND_QUOTE_BY_ID,
      [id],
    );
    if (!rows[0]) {
      throw new CotizacionNoEncontradaException();
    }

    const listItem = rows[0];
    const [issuer, extras, sections, shareLink, statusFlags, signedAsset] =
      await Promise.all([
        this.assertIssuer(listItem.issuerId),
        this.db.query<{
          companyTaxId: string | null;
          legalRepresentativeName: string;
          legalRepresentativeTaxId: string;
        }>(SQL_QUOTE_DETAIL_EXTRAS, [id]),
        this.loadSections(id),
        this.loadShare(id),
        this.loadStatusFlags([id]).then((map) => map.get(id) ?? []),
        this.loadSignedAsset(id),
      ]);

    const extra = extras.rows[0];

    return {
      ...listItem,
      statusFlags,
      issuer,
      companyTaxId: extra?.companyTaxId ?? null,
      legalRepresentativeName: extra?.legalRepresentativeName ?? '',
      legalRepresentativeTaxId: extra?.legalRepresentativeTaxId ?? '',
      sections,
      shareLink,
      signedAsset,
    };
  }

  private async attachStatusFlags(
    rows: Array<Omit<QuoteListItem, 'statusFlags'>>,
  ): Promise<QuoteListItem[]> {
    if (rows.length === 0) {
      return [];
    }
    const map = await this.loadStatusFlags(rows.map((row) => row.id));
    return rows.map((row) => ({
      ...row,
      statusFlags: map.get(row.id) ?? [],
    }));
  }

  private async loadStatusFlags(
    quoteIds: string[],
  ): Promise<Map<string, QuoteStatusFlag[]>> {
    const map = new Map<string, QuoteStatusFlag[]>();
    if (quoteIds.length === 0) {
      return map;
    }

    const { rows } = await this.db.query<QuoteStatusFlag & { quoteId: string }>(
      SQL_FIND_STATUSES_BY_QUOTE_IDS,
      [quoteIds],
    );

    for (const row of rows) {
      const list = map.get(row.quoteId) ?? [];
      list.push({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        sortOrder: row.sortOrder,
        assignedAt: row.assignedAt ?? null,
      });
      map.set(row.quoteId, list);
    }
    return map;
  }

  private async loadSignedAsset(quoteId: string): Promise<QuoteDetail['signedAsset']> {
    const { rows } = await this.db.query<NonNullable<QuoteDetail['signedAsset']>>(
      SQL_FIND_SIGNED_ASSET,
      [quoteId],
    );
    return rows[0] ?? null;
  }

  private async assignStatusCode(
    quoteId: string,
    code: string,
    actorUserId: string | null,
  ): Promise<void> {
    const { rows } = await this.db.query<QuoteStatusFlag>(SQL_FIND_STATUS_BY_CODE, [
      code,
    ]);
    const flag = rows[0];
    if (!flag) {
      throw new EstadoCotizacionInvalidoException(code);
    }

    await this.db.query(SQL_CLEAR_QUOTE_STATUSES, [quoteId]);
    await this.db.query(SQL_ASSIGN_STATUS, [quoteId, flag.id, actorUserId]);
  }

  async listPresets(
    actorUserId: string,
    companyId?: string,
  ): Promise<QuotePreset[]> {
    const { rows } = await this.db.query<QuotePreset>(SQL_FIND_PRESETS, [
      companyId ?? null,
    ]);
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.READ,
      tableName: 'quote_presets',
      recordId: null,
      newValues: { scope: 'list', companyId: companyId ?? null, resultCount: rows.length },
    });
    return rows;
  }

  async createPreset(
    actorUserId: string,
    dto: CreateQuotePresetDto,
  ): Promise<QuotePreset> {
    if (dto.companyId) {
      await this.companiesService.findById(actorUserId, dto.companyId);
    }

    const { rows } = await this.db.query<QuotePreset>(SQL_INSERT_PRESET, [
      dto.name.trim(),
      dto.companyId ?? null,
      actorUserId,
      JSON.stringify(dto.payload),
    ]);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: 'quote_presets',
      recordId: rows[0].id,
      newValues: this.asJson(rows[0]),
    });

    return rows[0];
  }

  async updatePreset(
    actorUserId: string,
    id: string,
    dto: UpdateQuotePresetDto,
  ): Promise<QuotePreset> {
    const previous = await this.findPresetOrThrow(id);
    const { rows } = await this.db.query<QuotePreset>(SQL_UPDATE_PRESET, [
      id,
      dto.name?.trim() ?? null,
      dto.payload ? JSON.stringify(dto.payload) : null,
    ]);

    if (!rows[0]) {
      throw new PresetCotizacionNoEncontradoException();
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: 'quote_presets',
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(rows[0]),
    });

    return rows[0];
  }

  async deletePreset(actorUserId: string, id: string): Promise<void> {
    const previous = await this.findPresetOrThrow(id);
    await this.db.query(SQL_DELETE_PRESET, [id]);
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.SOFT_DELETE,
      tableName: 'quote_presets',
      recordId: id,
      oldValues: this.asJson(previous),
    });
  }

  private async findPresetOrThrow(id: string): Promise<QuotePreset> {
    const { rows } = await this.db.query<QuotePreset>(SQL_FIND_PRESET_BY_ID, [
      id,
    ]);
    if (!rows[0]) {
      throw new PresetCotizacionNoEncontradoException();
    }
    return rows[0];
  }

  private async loadSections(quoteId: string): Promise<QuoteSection[]> {
    const { rows: sections } = await this.db.query<Omit<QuoteSection, 'items'>>(
      SQL_FIND_SECTIONS_BY_QUOTE,
      [quoteId],
    );

    if (sections.length === 0) {
      return [];
    }

    const sectionIds = sections.map((s) => s.id);
    const { rows: items } = await this.db.query<QuoteLineItem>(
      SQL_FIND_ITEMS_BY_SECTION_IDS,
      [sectionIds],
    );

    const bySection = new Map<string, QuoteLineItem[]>();
    for (const item of items) {
      const list = bySection.get(item.sectionId) ?? [];
      list.push(item);
      bySection.set(item.sectionId, list);
    }

    return sections.map((section) => ({
      ...section,
      items: bySection.get(section.id) ?? [],
    }));
  }

  private async loadShare(quoteId: string): Promise<QuoteShareLink | null> {
    const { rows } = await this.db.query<QuoteShareLink>(
      SQL_FIND_SHARE_BY_QUOTE,
      [quoteId],
    );
    return rows[0] ?? null;
  }

  private async persistSections(
    query: DbQuery,
    quoteId: string,
    documentType: QuoteDocumentType,
    sections: QuoteSectionDto[],
  ): Promise<void> {
    const order: QuoteFrequency[] = [
      QuoteFrequency.UNICO,
      QuoteFrequency.MENSUAL,
      QuoteFrequency.ANUAL,
    ];

    let sortOrder = 0;
    for (const frequency of order) {
      const section = sections.find((s) => s.frequency === frequency);
      if (!section || section.items.length === 0) {
        continue;
      }

      const totals = calculateSectionTotals({
        itemPrices: section.items.map((i) => i.price),
        documentType,
        applyTax: section.applyTax,
        priceInputMode: section.priceInputMode ?? PriceInputMode.GROSS,
      });

      const { rows } = await query<{ id: string }>(SQL_INSERT_SECTION, [
        quoteId,
        section.frequency,
        section.esCanje,
        section.applyTax,
        section.priceInputMode ?? PriceInputMode.GROSS,
        totals.subtotal,
        totals.taxAmount,
        totals.retentionAmount,
        totals.liquidAmount,
        totals.total,
        sortOrder,
      ]);

      const sectionId = rows[0].id;
      let itemOrder = 0;
      for (const item of section.items) {
        await query(SQL_INSERT_LINE_ITEM, [
          sectionId,
          item.title.trim(),
          item.description?.trim() ?? '',
          item.price,
          itemOrder,
        ]);
        itemOrder += 1;
      }
      sortOrder += 1;
    }
  }

  private async resolveScope(
    companyId: string,
    scope: QuoteScope,
    projectId?: string | null,
    ticketId?: string | null,
  ): Promise<{ projectId: string | null; ticketId: string | null }> {
    if (scope === QuoteScope.COMPANY) {
      if (projectId || ticketId) {
        throw new AlcanceCotizacionInvalidoException(
          'Una cotización a nivel de empresa no debe tener proyecto ni ticket',
        );
      }
      return { projectId: null, ticketId: null };
    }

    if (scope === QuoteScope.PROJECT) {
      if (!projectId) {
        throw new AlcanceCotizacionInvalidoException(
          'Debes seleccionar un proyecto',
        );
      }
      const { rows } = await this.db.query<{ id: string; companyId: string }>(
        SQL_FIND_PROJECT_FOR_COMPANY,
        [projectId, companyId],
      );
      if (!rows[0]) {
        throw new AlcanceCotizacionInvalidoException(
          'El proyecto no pertenece a esta empresa',
        );
      }
      return { projectId, ticketId: null };
    }

    if (!ticketId) {
      throw new AlcanceCotizacionInvalidoException(
        'Debes seleccionar un ticket',
      );
    }

    const { rows } = await this.db.query<{
      id: string;
      projectId: string;
      companyId: string;
    }>(SQL_FIND_TICKET_CHAIN, [ticketId]);

    const ticket = rows[0];
    if (!ticket || ticket.companyId !== companyId) {
      throw new AlcanceCotizacionInvalidoException(
        'El ticket no pertenece a esta empresa',
      );
    }

    if (projectId && projectId !== ticket.projectId) {
      throw new AlcanceCotizacionInvalidoException(
        'El ticket no pertenece al proyecto indicado',
      );
    }

    return { projectId: ticket.projectId, ticketId };
  }

  private async assertIssuer(issuerId: string): Promise<QuoteIssuer> {
    const { rows } = await this.db.query<QuoteIssuer>(SQL_FIND_ISSUER_BY_ID, [
      issuerId,
    ]);
    if (!rows[0] || !rows[0].isActive) {
      throw new EmisorNoEncontradoException();
    }
    return rows[0];
  }

  private async assertLegalRep(
    companyId: string,
    legalRepresentativeId: string,
  ): Promise<void> {
    const { rows } = await this.db.query(
      SQL_FIND_LEGAL_REP_FOR_COMPANY,
      [companyId, legalRepresentativeId],
    );
    if (!rows[0]) {
      throw new RepresentanteNoVinculadoException();
    }
  }

  private assertHasItems(sections: QuoteSectionDto[]): void {
    const hasItems = sections.some((s) => s.items.length > 0);
    if (!hasItems) {
      throw new SeccionCotizacionVaciaException();
    }
  }

  private async enableShare(
    quoteId: string,
    existingToken: string | null,
  ): Promise<void> {
    const token = existingToken || randomBytes(32).toString('hex');
    const enabledAt = new Date();
    const expiresAt = new Date(enabledAt.getTime() + SHARE_TTL_MS);

    await this.db.query(SQL_UPSERT_SHARE_LINK, [
      quoteId,
      token,
      true,
      enabledAt.toISOString(),
      expiresAt.toISOString(),
      null,
    ]);
  }

  private async disableShare(
    quoteId: string,
    existingToken: string | null,
  ): Promise<void> {
    await this.disableShareInTx(
      (text, params) => this.db.query(text, params),
      quoteId,
      existingToken,
    );
  }

  private async disableShareInTx(
    query: DbQuery,
    quoteId: string,
    existingToken: string | null,
  ): Promise<void> {
    const token = existingToken || randomBytes(32).toString('hex');
    await query(SQL_UPSERT_SHARE_LINK, [
      quoteId,
      token,
      false,
      null,
      null,
      new Date().toISOString(),
    ]);
  }

  private async notifyPortalUsers(
    actorUserId: string,
    quote: QuoteDetail,
  ): Promise<void> {
    const { rows } = await this.db.query<{ id: string }>(
      SQL_FIND_COMPANY_PORTAL_USER_IDS,
      [quote.companyId],
    );

    const message = `Nueva cotización #${quote.quoteNumber} disponible para revisión (enlace válido 24 horas)`;
    const shareToken = quote.shareLink?.token ?? null;

    for (const user of rows) {
      if (user.id === actorUserId) {
        continue;
      }
      await this.db.query(SQL_INSERT_QUOTE_NOTIFICATION, [
        user.id,
        quote.id,
        quote.companyId,
        actorUserId,
        'quote_sent',
        message,
        shareToken,
      ]);
    }
  }

  private addDays(isoDate: string, days: number): string {
    const date = new Date(`${isoDate}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private asJson(value: unknown): Record<string, unknown> {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  }
}
