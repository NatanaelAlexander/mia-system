import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthenticatedOnly,
  AuthorizeSurface,
} from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { TicketNotificationListResponseDto } from './dto/responses/notification-response.dto';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthenticatedOnly()
@ApiTags('Notifications — Internal')
@Controller('internal/notifications')
export class InternalNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis notificaciones de tickets' })
  @ApiBody({ type: ListNotificationsDto, required: false })
  @ApiOkResponse({ type: TicketNotificationListResponseDto })
  findAll(
    @CurrentUser('sub') userId: string,
    @Body() dto: ListNotificationsDto = {},
  ) {
    return this.notificationsService.listForUser(userId, dto.limit);
  }

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar mis notificaciones de tickets (body)' })
  @ApiBody({ type: ListNotificationsDto, required: false })
  @ApiOkResponse({ type: TicketNotificationListResponseDto })
  list(
    @CurrentUser('sub') userId: string,
    @Body() dto: ListNotificationsDto = {},
  ) {
    return this.notificationsService.listForUser(userId, dto.limit);
  }

  @Patch('leer-todas')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    await this.notificationsService.markAllAsRead(userId);
    return { ok: true };
  }

  @Patch('ticket/:ticketId/leer')
  @ApiOperation({
    summary: 'Marcar como leídas las notificaciones de un ticket',
  })
  @ApiParam({ name: 'ticketId', format: 'uuid' })
  async markTicketAsRead(
    @CurrentUser('sub') userId: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
  ) {
    await this.notificationsService.markTicketAsRead(userId, ticketId);
    return { ok: true };
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationsService.markAsRead(userId, id);
    return { ok: true };
  }
}

@ApiBearerAuth('access-token')
@AuthorizeSurface('portal')
@AuthenticatedOnly()
@ApiTags('Notifications — Portal')
@Controller('portal/notifications')
export class PortalNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis notificaciones de tickets (portal)' })
  @ApiBody({ type: ListNotificationsDto, required: false })
  @ApiOkResponse({ type: TicketNotificationListResponseDto })
  findAll(
    @CurrentUser('sub') userId: string,
    @Body() dto: ListNotificationsDto = {},
  ) {
    return this.notificationsService.listForUser(userId, dto.limit);
  }

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar mis notificaciones de tickets (portal, body)',
  })
  @ApiBody({ type: ListNotificationsDto, required: false })
  @ApiOkResponse({ type: TicketNotificationListResponseDto })
  list(
    @CurrentUser('sub') userId: string,
    @Body() dto: ListNotificationsDto = {},
  ) {
    return this.notificationsService.listForUser(userId, dto.limit);
  }

  @Patch('leer-todas')
  @ApiOperation({
    summary: 'Marcar todas las notificaciones como leídas (portal)',
  })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    await this.notificationsService.markAllAsRead(userId);
    return { ok: true };
  }

  @Patch('ticket/:ticketId/leer')
  @ApiOperation({
    summary: 'Marcar como leídas las notificaciones de un ticket (portal)',
  })
  @ApiParam({ name: 'ticketId', format: 'uuid' })
  async markTicketAsRead(
    @CurrentUser('sub') userId: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
  ) {
    await this.notificationsService.markTicketAsRead(userId, ticketId);
    return { ok: true };
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marcar una notificación como leída (portal)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.notificationsService.markAsRead(userId, id);
    return { ok: true };
  }
}
