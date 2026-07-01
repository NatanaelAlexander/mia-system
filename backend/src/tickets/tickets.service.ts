import { Injectable } from '@nestjs/common';
import { Asset } from '../assets/types/asset.types';
import { AssetsService } from '../assets/assets.service';
import { AuditAction } from '../audit/types/audit.types';
import { AuditService } from '../audit/audit.service';
import { PortalAccessService } from '../common/portal/portal-access.service';
import { DatabaseService } from '../common/database/database.service';
import { ProjectsService } from '../projects/projects.service';
import { ChangeTicketStatusDto } from './dto/change-ticket-status.dto';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import {
  PortalCreateTicketCommentDto,
  PortalCreateTicketDto,
} from './dto/portal-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  ArchivoYaVinculadoAlTicketException,
  CategoriaTicketNoEncontradaException,
  ComentarioTicketNoEncontradoException,
  EstadoPagoNoEncontradoException,
  EstadoTicketNoEncontradoException,
  PrioridadTicketNoEncontradaException,
  TicketNoEncontradoException,
  VinculoComentarioArchivoNoEncontradoException,
  VinculoTicketArchivoNoEncontradoException,
} from './exceptions/tickets.exceptions';
import { ProyectoNoEncontradoException } from '../projects/exceptions/projects.exceptions';
import {
  SQL_FIND_ALL_PAYMENT_STATUSES,
  SQL_FIND_ALL_TICKET_CATEGORIES,
  SQL_FIND_ALL_TICKET_PRIORITIES,
  SQL_FIND_ALL_TICKET_STATUSES,
  SQL_FIND_PAYMENT_STATUS_BY_ID,
  SQL_FIND_TICKET_CATEGORY_BY_ID,
  SQL_FIND_TICKET_PRIORITY_BY_ID,
  SQL_FIND_TICKET_STATUS_BY_ID,
  SQL_FIND_TICKET_STATUS_BY_NAME,
} from './queries/ticket-catalogs.queries';
import {
  SQL_DELETE_COMMENT_ASSET,
  SQL_DELETE_TICKET_ASSET,
  SQL_EXISTS_COMMENT_ASSET_LINK,
  SQL_EXISTS_TICKET_ASSET_LINK,
  SQL_FIND_COMMENT_ASSETS,
  SQL_FIND_TICKET_ASSETS,
  SQL_INSERT_COMMENT_ASSET,
  SQL_INSERT_TICKET_ASSET,
} from './queries/ticket-assets.queries';
import {
  SQL_FIND_TICKET_COMMENT_BY_ID,
  SQL_FIND_TICKET_COMMENTS,
  SQL_FIND_TICKET_COMMENTS_PUBLIC,
  SQL_INSERT_TICKET_COMMENT,
} from './queries/ticket-comments.queries';
import {
  SQL_FIND_TICKET_STATUS_HISTORY,
  SQL_INSERT_TICKET_STATUS_HISTORY,
} from './queries/ticket-status-history.queries';
import {
  SQL_FIND_ALL_TICKETS,
  SQL_FIND_ALL_TICKETS_FOR_PORTAL_USER,
  SQL_FIND_TICKET_BY_ID,
  SQL_INSERT_TICKET,
  SQL_UPDATE_TICKET_STATUS,
} from './queries/tickets.queries';
import {
  CatalogItem,
  Ticket,
  TicketComment,
  TicketStatusHistoryEntry,
  TicketStatusName,
} from './types/ticket.types';
import { JwtAccessPayload } from '../auth/types/auth.types';
import { TicketsRealtimeService } from './realtime/tickets-realtime.service';

const AUDIT_TABLE = {
  TICKETS: 'tickets',
  TICKET_COMMENTS: 'ticket_comments',
  TICKET_STATUS_HISTORY: 'ticket_status_history',
  TICKET_ASSETS: 'ticket_assets',
  TICKET_COMMENT_ASSETS: 'ticket_comment_assets',
  TICKET_STATUSES: 'ticket_statuses',
  TICKET_PRIORITIES: 'ticket_priorities',
  TICKET_CATEGORIES: 'ticket_categories',
  PAYMENT_STATUSES: 'payment_statuses',
} as const;

@Injectable()
export class TicketsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AuditService,
    private readonly portalAccess: PortalAccessService,
    private readonly projectsService: ProjectsService,
    private readonly assetsService: AssetsService,
    private readonly realtimeService: TicketsRealtimeService,
  ) {}

  async assertRealtimeTicketAccess(
    user: JwtAccessPayload,
    ticketId: string,
  ): Promise<{ isInternalViewer: boolean }> {
    const isInternalViewer = user.surfaces.includes('internal');

    if (isInternalViewer) {
      await this.findTicketRowById(ticketId);
      return { isInternalViewer: true };
    }

    if (user.surfaces.includes('portal')) {
      const hasAccess = await this.portalAccess.userHasTicket(user.sub, ticketId);
      if (!hasAccess) {
        throw new TicketNoEncontradoException();
      }

      const ticket = await this.findTicketRowById(ticketId);
      if (ticket.statusName === TicketStatusName.DRAFT) {
        throw new TicketNoEncontradoException();
      }

      return { isInternalViewer: false };
    }

    throw new TicketNoEncontradoException();
  }

  async findAllStatuses(actorUserId: string): Promise<CatalogItem[]> {
    const { rows } = await this.db.query<CatalogItem>(SQL_FIND_ALL_TICKET_STATUSES);
    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_STATUSES, null, {
      scope: 'list',
      resultCount: rows.length,
    });
    return rows;
  }

  async findAllPriorities(actorUserId: string): Promise<CatalogItem[]> {
    const { rows } = await this.db.query<CatalogItem>(SQL_FIND_ALL_TICKET_PRIORITIES);
    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_PRIORITIES, null, {
      scope: 'list',
      resultCount: rows.length,
    });
    return rows;
  }

  async findAllCategories(actorUserId: string): Promise<CatalogItem[]> {
    const { rows } = await this.db.query<CatalogItem>(SQL_FIND_ALL_TICKET_CATEGORIES);
    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_CATEGORIES, null, {
      scope: 'list',
      resultCount: rows.length,
    });
    return rows;
  }

  async findAllPaymentStatuses(actorUserId: string): Promise<CatalogItem[]> {
    const { rows } = await this.db.query<CatalogItem>(SQL_FIND_ALL_PAYMENT_STATUSES);
    await this.auditRead(actorUserId, AUDIT_TABLE.PAYMENT_STATUSES, null, {
      scope: 'list',
      resultCount: rows.length,
    });
    return rows;
  }

  async findAll(
    actorUserId: string,
    filters: FilterTicketsDto = {},
  ): Promise<Ticket[]> {
    const includeDrafts = filters.includeDrafts ?? false;
    const { rows } = await this.db.query<Ticket>(SQL_FIND_ALL_TICKETS, [
      includeDrafts,
      TicketStatusName.DRAFT,
      filters.projectId ?? null,
    ]);

    await this.auditRead(actorUserId, AUDIT_TABLE.TICKETS, null, {
      scope: 'list',
      resultCount: rows.length,
      projectId: filters.projectId ?? null,
      includeDrafts,
    });

    return rows;
  }

  async findAllForPortal(
    userId: string,
    projectId?: string,
  ): Promise<Ticket[]> {
    if (projectId) {
      const hasAccess = await this.portalAccess.userHasProject(
        userId,
        projectId,
      );
      if (!hasAccess) {
        throw new TicketNoEncontradoException();
      }
    }

    const { rows } = await this.db.query<Ticket>(
      SQL_FIND_ALL_TICKETS_FOR_PORTAL_USER,
      [userId, TicketStatusName.DRAFT, projectId ?? null],
    );

    await this.auditRead(userId, AUDIT_TABLE.TICKETS, null, {
      scope: 'portal_list',
      projectId: projectId ?? null,
      resultCount: rows.length,
    });

    return rows;
  }

  async findById(actorUserId: string, id: string): Promise<Ticket> {
    const ticket = await this.findTicketRowById(id);

    await this.auditRead(actorUserId, AUDIT_TABLE.TICKETS, id, { scope: 'detail' });

    return ticket;
  }

  async findByIdForPortal(userId: string, id: string): Promise<Ticket> {
    const hasAccess = await this.portalAccess.userHasTicket(userId, id);
    if (!hasAccess) {
      throw new TicketNoEncontradoException();
    }

    const ticket = await this.findTicketRowById(id);

    if (ticket.statusName === TicketStatusName.DRAFT) {
      throw new TicketNoEncontradoException();
    }

    await this.auditRead(userId, AUDIT_TABLE.TICKETS, id, {
      scope: 'portal_detail',
    });

    return ticket;
  }

  async createForPortal(
    userId: string,
    dto: PortalCreateTicketDto,
  ): Promise<Ticket> {
    const hasAccess = await this.portalAccess.userHasProject(
      userId,
      dto.projectId,
    );
    if (!hasAccess) {
      throw new ProyectoNoEncontradoException();
    }

    return this.create(userId, dto);
  }

  async create(actorUserId: string, dto: CreateTicketDto): Promise<Ticket> {
    await this.projectsService.findProjectRowById(dto.projectId);
    await this.ensurePriorityExists(dto.priorityId);

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    if (dto.paymentStatusId) {
      await this.ensurePaymentStatusExists(dto.paymentStatusId);
    }

    const createdStatus = await this.getStatusByName(TicketStatusName.CREATED);

    const { rows } = await this.db.query<{ id: string }>(SQL_INSERT_TICKET, [
      dto.projectId,
      actorUserId,
      dto.title,
      dto.description ?? null,
      createdStatus.id,
      dto.priorityId,
      dto.categoryId ?? null,
      dto.paymentStatusId ?? null,
      dto.assignedToId ?? null,
    ]);

    const ticketId = rows[0].id;

    await this.db.query(SQL_INSERT_TICKET_STATUS_HISTORY, [
      ticketId,
      createdStatus.id,
      actorUserId,
    ]);

    const ticket = await this.findTicketRowById(ticketId);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: AUDIT_TABLE.TICKETS,
      recordId: ticketId,
      newValues: this.asJson(ticket),
    });

    return ticket;
  }

  async update(
    actorUserId: string,
    id: string,
    dto: UpdateTicketDto,
  ): Promise<Ticket> {
    const previous = await this.findTicketRowById(id);

    if (dto.priorityId) {
      await this.ensurePriorityExists(dto.priorityId);
    }

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    if (dto.paymentStatusId) {
      await this.ensurePaymentStatusExists(dto.paymentStatusId);
    }

    const { sets, values } = this.buildTicketUpdate(dto);
    if (sets.length === 0) {
      return previous;
    }

    values.push(id);
    const idParam = values.length;

    const { rows } = await this.db.query<{ id: string }>(
      `UPDATE tickets SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idParam}
       RETURNING id`,
      values,
    );

    if (!rows[0]) {
      throw new TicketNoEncontradoException();
    }

    const updated = await this.findTicketRowById(id);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UPDATE,
      tableName: AUDIT_TABLE.TICKETS,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(updated),
    });

    return updated;
  }

  async changeStatus(
    actorUserId: string,
    id: string,
    dto: ChangeTicketStatusDto,
  ): Promise<Ticket> {
    const previous = await this.findTicketRowById(id);
    await this.ensureStatusExists(dto.statusId);

    if (previous.statusId === dto.statusId) {
      return previous;
    }

    const { rows } = await this.db.query<{ id: string }>(SQL_UPDATE_TICKET_STATUS, [
      dto.statusId,
      id,
    ]);

    if (!rows[0]) {
      throw new TicketNoEncontradoException();
    }

    await this.db.query(SQL_INSERT_TICKET_STATUS_HISTORY, [
      id,
      dto.statusId,
      actorUserId,
    ]);

    const updated = await this.findTicketRowById(id);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.STATUS_CHANGE,
      tableName: AUDIT_TABLE.TICKETS,
      recordId: id,
      oldValues: {
        statusId: previous.statusId,
        statusName: previous.statusName,
      },
      newValues: {
        statusId: updated.statusId,
        statusName: updated.statusName,
      },
    });

    this.realtimeService.emitTicketStatusChanged({
      ticket: updated,
      previous: {
        statusId: previous.statusId,
        statusName: previous.statusName,
      },
      changedByUserId: actorUserId,
    });

    return updated;
  }

  async moveToDraft(id: string, userId: string): Promise<Ticket> {
    const draftStatus = await this.getStatusByName(TicketStatusName.DRAFT);
    const previous = await this.findTicketRowById(id);

    if (previous.statusId === draftStatus.id) {
      return previous;
    }

    const { rows } = await this.db.query<{ id: string }>(SQL_UPDATE_TICKET_STATUS, [
      draftStatus.id,
      id,
    ]);

    if (!rows[0]) {
      throw new TicketNoEncontradoException();
    }

    await this.db.query(SQL_INSERT_TICKET_STATUS_HISTORY, [
      id,
      draftStatus.id,
      userId,
    ]);

    const updated = await this.findTicketRowById(id);

    await this.auditService.log({
      userId,
      action: AuditAction.SOFT_DELETE,
      tableName: AUDIT_TABLE.TICKETS,
      recordId: id,
      oldValues: this.asJson(previous),
      newValues: this.asJson(updated),
    });

    this.realtimeService.emitTicketStatusChanged({
      ticket: updated,
      previous: {
        statusId: previous.statusId,
        statusName: previous.statusName,
      },
      changedByUserId: userId,
    });

    return updated;
  }

  async getStatusHistory(
    actorUserId: string,
    ticketId: string,
  ): Promise<TicketStatusHistoryEntry[]> {
    await this.findTicketRowById(ticketId);

    const { rows } = await this.db.query<TicketStatusHistoryEntry>(
      SQL_FIND_TICKET_STATUS_HISTORY,
      [ticketId],
    );

    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_STATUS_HISTORY, ticketId, {
      scope: 'list_by_ticket',
      resultCount: rows.length,
    });

    return rows;
  }

  async getComments(
    actorUserId: string,
    ticketId: string,
  ): Promise<TicketComment[]> {
    await this.findTicketRowById(ticketId);

    const { rows } = await this.db.query<TicketComment>(SQL_FIND_TICKET_COMMENTS, [
      ticketId,
    ]);

    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_COMMENTS, ticketId, {
      scope: 'list_by_ticket',
      resultCount: rows.length,
    });

    return rows;
  }

  async getCommentsForPortal(
    userId: string,
    ticketId: string,
  ): Promise<TicketComment[]> {
    const hasAccess = await this.portalAccess.userHasTicket(userId, ticketId);
    if (!hasAccess) {
      throw new TicketNoEncontradoException();
    }

    const ticket = await this.findTicketRowById(ticketId);

    if (ticket.statusName === TicketStatusName.DRAFT) {
      throw new TicketNoEncontradoException();
    }

    const { rows } = await this.db.query<TicketComment>(
      SQL_FIND_TICKET_COMMENTS_PUBLIC,
      [ticketId],
    );

    await this.auditRead(userId, AUDIT_TABLE.TICKET_COMMENTS, ticketId, {
      scope: 'portal_list_by_ticket',
      resultCount: rows.length,
    });

    return rows;
  }

  async addComment(
    actorUserId: string,
    dto: CreateTicketCommentDto,
  ): Promise<TicketComment> {
    await this.findTicketRowById(dto.ticketId);

    const { rows } = await this.db.query<TicketComment>(SQL_INSERT_TICKET_COMMENT, [
      dto.ticketId,
      actorUserId,
      dto.comment,
      dto.isInternal ?? false,
    ]);

    const comment = rows[0];

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: AUDIT_TABLE.TICKET_COMMENTS,
      recordId: comment.id,
      newValues: this.asJson(comment),
    });

    this.realtimeService.emitCommentCreated(comment);

    return comment;
  }

  async addCommentForPortal(
    userId: string,
    dto: PortalCreateTicketCommentDto,
  ): Promise<TicketComment> {
    const hasAccess = await this.portalAccess.userHasTicket(
      userId,
      dto.ticketId,
    );
    if (!hasAccess) {
      throw new TicketNoEncontradoException();
    }

    const ticket = await this.findTicketRowById(dto.ticketId);
    if (ticket.statusName === TicketStatusName.DRAFT) {
      throw new TicketNoEncontradoException();
    }

    return this.addComment(userId, {
      ticketId: dto.ticketId,
      comment: dto.comment,
      isInternal: false,
    });
  }

  async getTicketAssets(
    actorUserId: string,
    ticketId: string,
  ): Promise<Asset[]> {
    await this.findTicketRowById(ticketId);

    const { rows } = await this.db.query<Asset>(SQL_FIND_TICKET_ASSETS, [ticketId]);

    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_ASSETS, ticketId, {
      scope: 'list_by_ticket',
      resultCount: rows.length,
    });

    return rows;
  }

  async getTicketAssetsForPortal(
    userId: string,
    ticketId: string,
  ): Promise<Asset[]> {
    await this.assertPortalTicketAccess(userId, ticketId);

    const { rows } = await this.db.query<Asset>(SQL_FIND_TICKET_ASSETS, [ticketId]);

    await this.auditRead(userId, AUDIT_TABLE.TICKET_ASSETS, ticketId, {
      scope: 'portal_list_by_ticket',
      resultCount: rows.length,
    });

    return rows;
  }

  async uploadAssetToTicketForPortal(
    userId: string,
    ticketId: string,
    file: Express.Multer.File,
    displayName?: string,
  ): Promise<Asset> {
    await this.assertPortalTicketAccess(userId, ticketId);
    return this.uploadAssetToTicket(userId, ticketId, file, displayName);
  }

  private async assertPortalTicketAccess(
    userId: string,
    ticketId: string,
  ): Promise<void> {
    const hasAccess = await this.portalAccess.userHasTicket(userId, ticketId);
    if (!hasAccess) {
      throw new TicketNoEncontradoException();
    }

    const ticket = await this.findTicketRowById(ticketId);
    if (ticket.statusName === TicketStatusName.DRAFT) {
      throw new TicketNoEncontradoException();
    }
  }

  async linkAsset(
    actorUserId: string,
    ticketId: string,
    assetId: string,
  ): Promise<void> {
    await this.findTicketRowById(ticketId);
    await this.assetsService.findById(assetId);

    const exists = await this.db.query(SQL_EXISTS_TICKET_ASSET_LINK, [
      ticketId,
      assetId,
    ]);

    if (exists.rowCount && exists.rowCount > 0) {
      throw new ArchivoYaVinculadoAlTicketException();
    }

    await this.db.query(SQL_INSERT_TICKET_ASSET, [ticketId, assetId]);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.ASSIGN,
      tableName: AUDIT_TABLE.TICKET_ASSETS,
      recordId: ticketId,
      newValues: { ticketId, assetId },
    });
  }

  async unlinkAsset(
    actorUserId: string,
    ticketId: string,
    assetId: string,
  ): Promise<void> {
    const result = await this.db.query(SQL_DELETE_TICKET_ASSET, [ticketId, assetId]);

    if (!result.rowCount) {
      throw new VinculoTicketArchivoNoEncontradoException();
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UNLINK,
      tableName: AUDIT_TABLE.TICKET_ASSETS,
      recordId: ticketId,
      oldValues: { ticketId, assetId },
    });
  }

  async uploadAssetToTicket(
    actorUserId: string,
    ticketId: string,
    file: Express.Multer.File,
    displayName?: string,
  ): Promise<Asset> {
    await this.findTicketRowById(ticketId);

    const asset = await this.assetsService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      ownerType: 'tickets',
      ownerId: ticketId,
      uploadedById: actorUserId,
      displayFileName: displayName?.trim() || undefined,
    });

    await this.db.query(SQL_INSERT_TICKET_ASSET, [ticketId, asset.id]);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.ASSIGN,
      tableName: AUDIT_TABLE.TICKET_ASSETS,
      recordId: ticketId,
      newValues: {
        ticketId,
        assetId: asset.id,
        fileName: asset.fileName,
        source: 'upload',
      },
    });

    return asset;
  }

  async getCommentAssets(
    actorUserId: string,
    ticketCommentId: string,
  ): Promise<Asset[]> {
    await this.findCommentRowById(ticketCommentId);

    const { rows } = await this.db.query<Asset>(SQL_FIND_COMMENT_ASSETS, [
      ticketCommentId,
    ]);

    await this.auditRead(
      actorUserId,
      AUDIT_TABLE.TICKET_COMMENT_ASSETS,
      ticketCommentId,
      {
        scope: 'list_by_comment',
        resultCount: rows.length,
      },
    );

    return rows;
  }

  async linkAssetToComment(
    actorUserId: string,
    ticketCommentId: string,
    assetId: string,
  ): Promise<void> {
    await this.findCommentRowById(ticketCommentId);
    await this.assetsService.findById(assetId);

    const exists = await this.db.query(SQL_EXISTS_COMMENT_ASSET_LINK, [
      ticketCommentId,
      assetId,
    ]);

    if (exists.rowCount && exists.rowCount > 0) {
      throw new ArchivoYaVinculadoAlTicketException();
    }

    await this.db.query(SQL_INSERT_COMMENT_ASSET, [ticketCommentId, assetId]);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.ASSIGN,
      tableName: AUDIT_TABLE.TICKET_COMMENT_ASSETS,
      recordId: ticketCommentId,
      newValues: { ticketCommentId, assetId },
    });
  }

  async unlinkAssetFromComment(
    actorUserId: string,
    ticketCommentId: string,
    assetId: string,
  ): Promise<void> {
    const result = await this.db.query(SQL_DELETE_COMMENT_ASSET, [
      ticketCommentId,
      assetId,
    ]);

    if (!result.rowCount) {
      throw new VinculoComentarioArchivoNoEncontradoException();
    }

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.UNLINK,
      tableName: AUDIT_TABLE.TICKET_COMMENT_ASSETS,
      recordId: ticketCommentId,
      oldValues: { ticketCommentId, assetId },
    });
  }

  async uploadAssetToComment(
    actorUserId: string,
    ticketCommentId: string,
    file: Express.Multer.File,
    displayName?: string,
  ): Promise<Asset> {
    await this.findCommentRowById(ticketCommentId);

    const asset = await this.assetsService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      ownerType: 'tickets',
      ownerId: ticketCommentId,
      uploadedById: actorUserId,
      displayFileName: displayName?.trim() || undefined,
    });

    await this.db.query(SQL_INSERT_COMMENT_ASSET, [ticketCommentId, asset.id]);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.ASSIGN,
      tableName: AUDIT_TABLE.TICKET_COMMENT_ASSETS,
      recordId: ticketCommentId,
      newValues: {
        ticketCommentId,
        assetId: asset.id,
        fileName: asset.fileName,
        source: 'upload',
      },
    });

    return asset;
  }

  async getCommentAssetsForPortal(
    userId: string,
    ticketCommentId: string,
  ): Promise<Asset[]> {
    const comment = await this.findCommentRowById(ticketCommentId);
    await this.assertPortalCommentAccess(userId, comment);

    const { rows } = await this.db.query<Asset>(SQL_FIND_COMMENT_ASSETS, [
      ticketCommentId,
    ]);

    await this.auditRead(
      userId,
      AUDIT_TABLE.TICKET_COMMENT_ASSETS,
      ticketCommentId,
      {
        scope: 'portal_list_by_comment',
        resultCount: rows.length,
      },
    );

    return rows;
  }

  async uploadAssetToCommentForPortal(
    userId: string,
    ticketCommentId: string,
    file: Express.Multer.File,
    displayName?: string,
  ): Promise<Asset> {
    const comment = await this.findCommentRowById(ticketCommentId);
    await this.assertPortalCommentAccess(userId, comment);

    return this.uploadAssetToComment(userId, ticketCommentId, file, displayName);
  }

  private async assertPortalCommentAccess(
    userId: string,
    comment: TicketComment,
  ): Promise<void> {
    if (comment.isInternal) {
      throw new ComentarioTicketNoEncontradoException();
    }

    const hasAccess = await this.portalAccess.userHasTicket(
      userId,
      comment.ticketId,
    );
    if (!hasAccess) {
      throw new TicketNoEncontradoException();
    }

    const ticket = await this.findTicketRowById(comment.ticketId);
    if (ticket.statusName === TicketStatusName.DRAFT) {
      throw new TicketNoEncontradoException();
    }
  }

  private async findTicketRowById(id: string): Promise<Ticket> {
    const { rows } = await this.db.query<Ticket>(SQL_FIND_TICKET_BY_ID, [id]);

    if (!rows[0]) {
      throw new TicketNoEncontradoException();
    }

    return rows[0];
  }

  private async findCommentRowById(id: string): Promise<TicketComment> {
    const { rows } = await this.db.query<TicketComment>(
      SQL_FIND_TICKET_COMMENT_BY_ID,
      [id],
    );

    if (!rows[0]) {
      throw new ComentarioTicketNoEncontradoException();
    }

    return rows[0];
  }

  private async getStatusByName(name: string): Promise<CatalogItem> {
    const { rows } = await this.db.query<CatalogItem>(
      SQL_FIND_TICKET_STATUS_BY_NAME,
      [name],
    );

    if (!rows[0]) {
      throw new EstadoTicketNoEncontradoException();
    }

    return rows[0];
  }

  private async ensureStatusExists(id: string): Promise<void> {
    const { rows } = await this.db.query<CatalogItem>(
      SQL_FIND_TICKET_STATUS_BY_ID,
      [id],
    );

    if (!rows[0]) {
      throw new EstadoTicketNoEncontradoException();
    }
  }

  private async ensurePriorityExists(id: string): Promise<void> {
    const { rows } = await this.db.query<CatalogItem>(
      SQL_FIND_TICKET_PRIORITY_BY_ID,
      [id],
    );

    if (!rows[0]) {
      throw new PrioridadTicketNoEncontradaException();
    }
  }

  private async ensureCategoryExists(id: string): Promise<void> {
    const { rows } = await this.db.query<CatalogItem>(
      SQL_FIND_TICKET_CATEGORY_BY_ID,
      [id],
    );

    if (!rows[0]) {
      throw new CategoriaTicketNoEncontradaException();
    }
  }

  private async ensurePaymentStatusExists(id: string): Promise<void> {
    const { rows } = await this.db.query<CatalogItem>(
      SQL_FIND_PAYMENT_STATUS_BY_ID,
      [id],
    );

    if (!rows[0]) {
      throw new EstadoPagoNoEncontradoException();
    }
  }

  private buildTicketUpdate(dto: UpdateTicketDto): {
    sets: string[];
    values: unknown[];
  } {
    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const columns: Array<{
      field: keyof UpdateTicketDto;
      column: string;
    }> = [
      { field: 'title', column: 'title' },
      { field: 'description', column: 'description' },
      { field: 'priorityId', column: 'priority_id' },
      { field: 'categoryId', column: 'category_id' },
      { field: 'paymentStatusId', column: 'payment_status_id' },
      { field: 'assignedToId', column: 'assigned_to_id' },
    ];

    for (const { field, column } of columns) {
      if (dto[field] !== undefined) {
        sets.push(`${column} = $${index++}`);
        values.push(dto[field]);
      }
    }

    return { sets, values };
  }

  private async auditRead(
    actorUserId: string,
    tableName: string,
    recordId: string | null,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.READ,
      tableName,
      recordId,
      newValues: metadata,
    });
  }

  private asJson(value: object): Record<string, unknown> {
    return { ...value } as Record<string, unknown>;
  }
}
