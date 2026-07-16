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
  TicketTimelineRange,
} from './dto/filter-ticket-timeline.dto';
import {
  PortalCreateTicketCommentDto,
  PortalCreateTicketDto,
  PortalFilterTicketsDto,
} from './dto/portal-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AssignTicketUsersDto } from './dto/assign-ticket-users.dto';
import {
  AsignadoTicketInvalidoException,
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
  SQL_ASSIGN_ACTIVE_SUPER_ADMINS,
  SQL_FIND_ASSIGNEES_BY_TICKET_IDS,
  SQL_FIND_TICKET_ASSIGNEES,
  SQL_FIND_VALID_INTERNAL_ASSIGNEES,
  SQL_IS_TICKET_ASSIGNEE,
  SQL_REPLACE_TICKET_ASSIGNEES,
} from './queries/ticket-assignees.queries';
import {
  SQL_FIND_ALL_TICKETS_KANBAN,
  SQL_FIND_ALL_TICKETS_FOR_PORTAL_USER_KANBAN,
} from './queries/ticket-kanban.queries';
import { SQL_TICKET_TIMELINE, SQL_TICKET_TIMELINE_FOR_PORTAL_USER } from './queries/ticket-timeline.queries';
import {
  SQL_FIND_TICKET_BY_ID,
  SQL_INSERT_TICKET,
  SQL_UPDATE_TICKET_STATUS,
} from './queries/tickets.queries';
import {
  CatalogItem,
  Ticket,
  TicketAssignee,
  TicketComment,
  TicketKanbanItem,
  TicketStatusHistoryEntry,
  TicketTimelinePoint,
  TICKET_CLOSED_STATUS_NAMES,
  TICKET_WORKING_STATUS_NAMES,
  TicketStatusName,
} from './types/ticket.types';
import { JwtAccessPayload } from '../auth/types/auth.types';
import { TicketsRealtimeService } from './realtime/tickets-realtime.service';
import { PermissionsService } from '../auth/permissions/permissions.service';
import { PermisoDenegadoException } from '../auth/exceptions/auth.exceptions';
import { NotificationsService } from '../notifications/notifications.service';

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
  TICKET_ASSIGNEES: 'ticket_assignees',
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
    private readonly permissionsService: PermissionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async assertRealtimeTicketAccess(
    user: JwtAccessPayload,
    ticketId: string,
  ): Promise<{ isInternalViewer: boolean }> {
    const isInternalViewer = user.surfaces.includes('internal');

    if (isInternalViewer) {
      await this.assertCanAccessTicket(user.sub, ticketId);
      return { isInternalViewer: true };
    }

    if (user.surfaces.includes('portal')) {
      await this.portalAccess.assertTicket(user.sub, ticketId, () => {
        throw new TicketNoEncontradoException();
      });

      const ticket = await this.findTicketRowById(ticketId);
      if (ticket.statusName === TicketStatusName.DRAFT) {
        throw new TicketNoEncontradoException();
      }

      return { isInternalViewer: false };
    }

    throw new TicketNoEncontradoException();
  }

  async findAllStatuses(actorUserId: string): Promise<CatalogItem[]> {
    const { rows } = await this.db.query<CatalogItem>(
      SQL_FIND_ALL_TICKET_STATUSES,
    );
    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_STATUSES, null, {
      scope: 'list',
      resultCount: rows.length,
    });
    return rows;
  }

  async findAllStatusesForPortal(actorUserId: string): Promise<CatalogItem[]> {
    const statuses = await this.findAllStatuses(actorUserId);
    return statuses.filter((status) => status.name !== TicketStatusName.DRAFT);
  }

  async findAllPriorities(actorUserId: string): Promise<CatalogItem[]> {
    const { rows } = await this.db.query<CatalogItem>(
      SQL_FIND_ALL_TICKET_PRIORITIES,
    );
    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_PRIORITIES, null, {
      scope: 'list',
      resultCount: rows.length,
    });
    return rows;
  }

  async findAllCategories(actorUserId: string): Promise<CatalogItem[]> {
    const { rows } = await this.db.query<CatalogItem>(
      SQL_FIND_ALL_TICKET_CATEGORIES,
    );
    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_CATEGORIES, null, {
      scope: 'list',
      resultCount: rows.length,
    });
    return rows;
  }

  async findAllPaymentStatuses(actorUserId: string): Promise<CatalogItem[]> {
    const { rows } = await this.db.query<CatalogItem>(
      SQL_FIND_ALL_PAYMENT_STATUSES,
    );
    await this.auditRead(actorUserId, AUDIT_TABLE.PAYMENT_STATUSES, null, {
      scope: 'list',
      resultCount: rows.length,
    });
    return rows;
  }

  async findAll(
    actorUserId: string,
    filters: FilterTicketsDto = {},
  ): Promise<TicketKanbanItem[]> {
    const includeDrafts = filters.includeDrafts ?? false;
    const isSuperAdmin = await this.isActorSuperAdmin(actorUserId);
    const { rows } = await this.db.query<TicketKanbanItem>(
      SQL_FIND_ALL_TICKETS_KANBAN,
      [
        includeDrafts,
        TicketStatusName.DRAFT,
        filters.projectId ?? null,
        filters.lifecycle ?? null,
        filters.workingOnly ?? false,
        isSuperAdmin,
        actorUserId,
      ],
    );

    const items = rows.map((row) => this.toKanbanItem(row));
    const withAssignees = await this.attachAssigneesToTickets(items);

    await this.auditRead(actorUserId, AUDIT_TABLE.TICKETS, null, {
      scope: 'list',
      resultCount: withAssignees.length,
      projectId: filters.projectId ?? null,
      includeDrafts,
      lifecycle: filters.lifecycle ?? null,
      workingOnly: filters.workingOnly ?? false,
    });

    return withAssignees;
  }

  async getTimeline(
    actorUserId: string,
    range: TicketTimelineRange,
  ): Promise<TicketTimelinePoint[]> {
    const { trunc, interval, start } = this.resolveTimelineBounds(range);
    const isSuperAdmin = await this.isActorSuperAdmin(actorUserId);

    const { rows } = await this.db.query<TicketTimelinePoint>(
      SQL_TICKET_TIMELINE,
      [trunc, start.toISOString(), interval, isSuperAdmin, actorUserId],
    );

    await this.auditRead(actorUserId, AUDIT_TABLE.TICKETS, null, {
      scope: 'timeline',
      range,
      resultCount: rows.length,
    });

    return rows;
  }

  async getTimelineForPortal(
    userId: string,
    range: TicketTimelineRange,
  ): Promise<TicketTimelinePoint[]> {
    const { trunc, interval, start } = this.resolveTimelineBounds(range);

    const { rows } = await this.db.query<TicketTimelinePoint>(
      SQL_TICKET_TIMELINE_FOR_PORTAL_USER,
      [trunc, start.toISOString(), interval, userId],
    );

    await this.auditRead(userId, AUDIT_TABLE.TICKETS, null, {
      scope: 'portal_timeline',
      range,
      resultCount: rows.length,
    });

    return rows;
  }

  async findAllForPortal(
    userId: string,
    filters: PortalFilterTicketsDto = {},
  ): Promise<TicketKanbanItem[]> {
    const projectId = filters.projectId;
    if (projectId) {
      await this.portalAccess.assertProject(userId, projectId, () => {
        throw new TicketNoEncontradoException();
      });
    }

    const { rows } = await this.db.query<TicketKanbanItem>(
      SQL_FIND_ALL_TICKETS_FOR_PORTAL_USER_KANBAN,
      [
        userId,
        TicketStatusName.DRAFT,
        projectId ?? null,
        filters.lifecycle ?? null,
        filters.workingOnly ?? false,
      ],
    );

    const items = rows.map((row) => this.toKanbanItem(row));

    await this.auditRead(userId, AUDIT_TABLE.TICKETS, null, {
      scope: 'portal_list',
      projectId: projectId ?? null,
      resultCount: items.length,
      lifecycle: filters.lifecycle ?? null,
      workingOnly: filters.workingOnly ?? false,
    });

    return items;
  }

  async findById(actorUserId: string, id: string): Promise<Ticket> {
    const ticket = await this.assertCanAccessTicket(actorUserId, id);

    await this.auditRead(actorUserId, AUDIT_TABLE.TICKETS, id, {
      scope: 'detail',
    });

    return ticket;
  }

  async findByIdForPortal(userId: string, id: string): Promise<Ticket> {
    await this.portalAccess.assertTicket(userId, id, () => {
      throw new TicketNoEncontradoException();
    });

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
    await this.portalAccess.assertProject(userId, dto.projectId, () => {
      throw new ProyectoNoEncontradoException();
    });

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
      null,
    ]);

    const ticketId = rows[0].id;

    await this.db.query(SQL_ASSIGN_ACTIVE_SUPER_ADMINS, [ticketId]);

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

    await this.notificationsService.notifyTicketCreated(actorUserId, ticket);

    return ticket;
  }

  async update(
    actorUserId: string,
    id: string,
    dto: UpdateTicketDto,
  ): Promise<Ticket> {
    const previous = await this.assertCanAccessTicket(actorUserId, id);

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
    const previous = await this.assertCanAccessTicket(actorUserId, id);
    await this.assertCanChangeStatus(actorUserId, id);
    await this.ensureStatusExists(dto.statusId);

    if (previous.statusId === dto.statusId) {
      return previous;
    }

    const { rows } = await this.db.query<{ id: string }>(
      SQL_UPDATE_TICKET_STATUS,
      [dto.statusId, id],
    );

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

  async getAssignees(
    actorUserId: string,
    ticketId: string,
  ): Promise<TicketAssignee[]> {
    await this.assertCanAccessTicket(actorUserId, ticketId);
    const { rows } = await this.db.query<TicketAssignee>(
      SQL_FIND_TICKET_ASSIGNEES,
      [ticketId],
    );

    await this.auditRead(actorUserId, AUDIT_TABLE.TICKET_ASSIGNEES, ticketId, {
      scope: 'list_by_ticket',
      resultCount: rows.length,
    });

    return rows;
  }

  async replaceAssignees(
    actorUserId: string,
    ticketId: string,
    dto: AssignTicketUsersDto,
  ): Promise<TicketAssignee[]> {
    await this.findTicketRowById(ticketId);
    await this.assertSuperAdmin(actorUserId);

    if (dto.userIds.length > 0) {
      const { rows } = await this.db.query<{ id: string }>(
        SQL_FIND_VALID_INTERNAL_ASSIGNEES,
        [dto.userIds],
      );
      if (rows.length !== dto.userIds.length) {
        throw new AsignadoTicketInvalidoException();
      }
    }

    const previous = await this.getAssignees(actorUserId, ticketId);
    await this.db.query(SQL_REPLACE_TICKET_ASSIGNEES, [ticketId, dto.userIds]);
    const updated = await this.getAssignees(actorUserId, ticketId);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.ASSIGN,
      tableName: AUDIT_TABLE.TICKET_ASSIGNEES,
      recordId: ticketId,
      oldValues: { assignees: previous },
      newValues: { assignees: updated },
    });

    return updated;
  }

  async moveToDraft(id: string, userId: string): Promise<Ticket> {
    const draftStatus = await this.getStatusByName(TicketStatusName.DRAFT);
    const previous = await this.assertCanAccessTicket(userId, id);
    await this.assertCanChangeStatus(userId, id);

    if (previous.statusId === draftStatus.id) {
      return previous;
    }

    const { rows } = await this.db.query<{ id: string }>(
      SQL_UPDATE_TICKET_STATUS,
      [draftStatus.id, id],
    );

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
    await this.assertCanAccessTicket(actorUserId, ticketId);

    const { rows } = await this.db.query<TicketStatusHistoryEntry>(
      SQL_FIND_TICKET_STATUS_HISTORY,
      [ticketId],
    );

    await this.auditRead(
      actorUserId,
      AUDIT_TABLE.TICKET_STATUS_HISTORY,
      ticketId,
      {
        scope: 'list_by_ticket',
        resultCount: rows.length,
      },
    );

    return rows;
  }

  async getComments(
    actorUserId: string,
    ticketId: string,
  ): Promise<TicketComment[]> {
    await this.assertCanAccessTicket(actorUserId, ticketId);

    const { rows } = await this.db.query<TicketComment>(
      SQL_FIND_TICKET_COMMENTS,
      [ticketId],
    );

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
    await this.portalAccess.assertTicket(userId, ticketId, () => {
      throw new TicketNoEncontradoException();
    });

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
    await this.assertCanAccessTicket(actorUserId, dto.ticketId);
    return this.insertComment(actorUserId, dto);
  }

  async addCommentForPortal(
    userId: string,
    dto: PortalCreateTicketCommentDto,
  ): Promise<TicketComment> {
    await this.portalAccess.assertTicket(userId, dto.ticketId, () => {
      throw new TicketNoEncontradoException();
    });

    const ticket = await this.findTicketRowById(dto.ticketId);
    if (ticket.statusName === TicketStatusName.DRAFT) {
      throw new TicketNoEncontradoException();
    }

    return this.insertComment(userId, {
      ticketId: dto.ticketId,
      comment: dto.comment,
      isInternal: false,
    });
  }

  private async insertComment(
    actorUserId: string,
    dto: CreateTicketCommentDto,
  ): Promise<TicketComment> {
    const { rows: inserted } = await this.db.query<{ id: string }>(
      SQL_INSERT_TICKET_COMMENT,
      [dto.ticketId, actorUserId, dto.comment, dto.isInternal ?? false],
    );

    const comment = await this.findCommentRowById(inserted[0].id);

    await this.auditService.log({
      userId: actorUserId,
      action: AuditAction.CREATE,
      tableName: AUDIT_TABLE.TICKET_COMMENTS,
      recordId: comment.id,
      newValues: this.asJson(comment),
    });

    this.realtimeService.emitCommentCreated(comment);

    const ticket = await this.findTicketRowById(dto.ticketId);
    await this.notificationsService.notifyTicketComment(
      actorUserId,
      ticket,
      comment,
    );

    return comment;
  }

  async getTicketAssets(
    actorUserId: string,
    ticketId: string,
  ): Promise<Asset[]> {
    await this.assertCanAccessTicket(actorUserId, ticketId);

    const { rows } = await this.db.query<Asset>(SQL_FIND_TICKET_ASSETS, [
      ticketId,
    ]);

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

    const { rows } = await this.db.query<Asset>(SQL_FIND_TICKET_ASSETS, [
      ticketId,
    ]);

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
    return this.insertTicketUpload(userId, ticketId, file, displayName);
  }

  private async assertPortalTicketAccess(
    userId: string,
    ticketId: string,
  ): Promise<void> {
    await this.portalAccess.assertTicket(userId, ticketId, () => {
      throw new TicketNoEncontradoException();
    });

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
    await this.assertCanAccessTicket(actorUserId, ticketId);
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
    await this.assertCanAccessTicket(actorUserId, ticketId);

    const result = await this.db.query(SQL_DELETE_TICKET_ASSET, [
      ticketId,
      assetId,
    ]);

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
    await this.assertCanAccessTicket(actorUserId, ticketId);
    return this.insertTicketUpload(actorUserId, ticketId, file, displayName);
  }

  private async insertTicketUpload(
    actorUserId: string,
    ticketId: string,
    file: Express.Multer.File,
    displayName?: string,
  ): Promise<Asset> {
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
    const comment = await this.findCommentRowById(ticketCommentId);
    await this.assertCanAccessTicket(actorUserId, comment.ticketId);

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
    const comment = await this.findCommentRowById(ticketCommentId);
    await this.assertCanAccessTicket(actorUserId, comment.ticketId);
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
    const comment = await this.findCommentRowById(ticketCommentId);
    await this.assertCanAccessTicket(actorUserId, comment.ticketId);

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
    const comment = await this.findCommentRowById(ticketCommentId);
    await this.assertCanAccessTicket(actorUserId, comment.ticketId);
    return this.insertCommentUpload(
      actorUserId,
      comment,
      ticketCommentId,
      file,
      displayName,
    );
  }

  private async insertCommentUpload(
    actorUserId: string,
    comment: TicketComment,
    ticketCommentId: string,
    file: Express.Multer.File,
    displayName?: string,
  ): Promise<Asset> {
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

    const assetPayload = {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      createdAt: asset.createdAt,
    };

    this.realtimeService.emitCommentAssetAdded({
      ticketId: comment.ticketId,
      commentId: ticketCommentId,
      isInternal: comment.isInternal,
      asset: assetPayload,
    });

    const { rows: commentAssets } = await this.db.query<Asset>(
      SQL_FIND_COMMENT_ASSETS,
      [ticketCommentId],
    );

    this.realtimeService.emitCommentAssetsUpdated({
      ticketId: comment.ticketId,
      commentId: ticketCommentId,
      isInternal: comment.isInternal,
      assets: commentAssets.map((item) => ({
        id: item.id,
        fileName: item.fileName,
        mimeType: item.mimeType,
        fileSize: item.fileSize,
        createdAt: item.createdAt,
      })),
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

    return this.insertCommentUpload(
      userId,
      comment,
      ticketCommentId,
      file,
      displayName,
    );
  }

  private async assertPortalCommentAccess(
    userId: string,
    comment: TicketComment,
  ): Promise<void> {
    if (comment.isInternal) {
      throw new ComentarioTicketNoEncontradoException();
    }

    await this.portalAccess.assertTicket(userId, comment.ticketId, () => {
      throw new TicketNoEncontradoException();
    });

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

  private async isActorSuperAdmin(userId: string): Promise<boolean> {
    const authorization =
      await this.permissionsService.resolveAuthorization(userId);
    return Boolean(
      authorization &&
        this.permissionsService.isSuperAdmin(authorization.roles),
    );
  }

  /**
   * Internal ticket ACL: superadmin sees all; everyone else must be assigned.
   * Returns the ticket row when access is allowed.
   */
  private async assertCanAccessTicket(
    userId: string,
    ticketId: string,
  ): Promise<Ticket> {
    const ticket = await this.findTicketRowById(ticketId);

    if (await this.isActorSuperAdmin(userId)) {
      return ticket;
    }

    const { rows } = await this.db.query<{ isAssigned: boolean }>(
      SQL_IS_TICKET_ASSIGNEE,
      [ticketId, userId],
    );
    if (!rows[0]?.isAssigned) {
      throw new TicketNoEncontradoException();
    }

    return ticket;
  }

  private async assertSuperAdmin(userId: string): Promise<void> {
    if (!(await this.isActorSuperAdmin(userId))) {
      throw new PermisoDenegadoException();
    }
  }

  private async assertCanChangeStatus(
    userId: string,
    ticketId: string,
  ): Promise<void> {
    const authorization =
      await this.permissionsService.resolveAuthorization(userId);

    if (
      authorization &&
      this.permissionsService.isSuperAdmin(authorization.roles)
    ) {
      return;
    }

    if (!authorization?.roles.includes('admin')) {
      throw new PermisoDenegadoException();
    }

    const { rows } = await this.db.query<{ isAssigned: boolean }>(
      SQL_IS_TICKET_ASSIGNEE,
      [ticketId, userId],
    );
    if (!rows[0]?.isAssigned) {
      throw new PermisoDenegadoException();
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
    ];

    for (const { field, column } of columns) {
      if (dto[field] !== undefined) {
        sets.push(`${column} = $${index++}`);
        values.push(dto[field]);
      }
    }

    return { sets, values };
  }

  private resolveTimelineBounds(range: TicketTimelineRange): {
    trunc: string;
    interval: string;
    start: Date;
    end: Date;
  } {
    const now = new Date();

    if (range === 'day') {
      const end = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          0,
          0,
          0,
        ),
      );
      const start = new Date(end);
      start.setUTCHours(start.getUTCHours() - 23);
      return { trunc: 'hour', interval: '1 hour', start, end };
    }

    if (range === 'month') {
      const end = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0,
          0,
          0,
          0,
        ),
      );
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 29);
      return { trunc: 'day', interval: '1 day', start, end };
    }

    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    const start = new Date(end);
    start.setUTCMonth(start.getUTCMonth() - 11);
    return { trunc: 'month', interval: '1 month', start, end };
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
    return { ...value };
  }

  private toKanbanItem(row: TicketKanbanItem): TicketKanbanItem {
    return {
      ...row,
      isClosed: TICKET_CLOSED_STATUS_NAMES.has(row.statusName),
      isWorking: TICKET_WORKING_STATUS_NAMES.has(row.statusName),
    };
  }

  private async attachAssigneesToTickets(
    tickets: TicketKanbanItem[],
  ): Promise<TicketKanbanItem[]> {
    if (tickets.length === 0) {
      return tickets;
    }

    const ticketIds = tickets.map((ticket) => ticket.id);
    const { rows } = await this.db.query<
      TicketAssignee & { ticketId: string }
    >(SQL_FIND_ASSIGNEES_BY_TICKET_IDS, [ticketIds]);

    const assigneesByTicket = new Map<string, TicketAssignee[]>();
    for (const row of rows) {
      const { ticketId, ...assignee } = row;
      const current = assigneesByTicket.get(ticketId) ?? [];
      current.push(assignee);
      assigneesByTicket.set(ticketId, current);
    }

    return tickets.map((ticket) => ({
      ...ticket,
      assignees: assigneesByTicket.get(ticket.id) ?? [],
    }));
  }
}
