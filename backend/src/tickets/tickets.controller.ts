import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import {
  AuthorizeResource,
  AuthorizeSurface,
} from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FindByIdDto } from '../common/dto/find-by-id.dto';
import { AssetResponseDto } from '../assets/dto/responses/asset-response.dto';
import { ChangeTicketStatusDto } from './dto/change-ticket-status.dto';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import {
  GetCommentAssetsDto,
  GetTicketAssetsDto,
  GetTicketCommentsDto,
  GetTicketStatusHistoryDto,
  LinkCommentAssetDto,
  LinkTicketAssetDto,
  UnlinkCommentAssetDto,
  UnlinkTicketAssetDto,
  UploadCommentAssetDto,
  UploadTicketAssetDto,
} from './dto/ticket-assets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  PortalCreateTicketCommentDto,
  PortalCreateTicketDto,
  PortalFilterTicketsDto,
} from './dto/portal-tickets.dto';
import {
  CatalogItemResponseDto,
  TicketCommentResponseDto,
  TicketResponseDto,
  TicketStatusHistoryResponseDto,
} from './dto/responses/ticket-response.dto';
import { TicketsService } from './tickets.service';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('tickets')
@ApiTags('Tickets — Internal')
@Controller('internal/tickets')
export class InternalTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('catalogos/estados')
  @ApiOperation({ summary: 'Listar estados de ticket' })
  @ApiOkResponse({ type: CatalogItemResponseDto, isArray: true })
  findAllStatuses(@CurrentUser('sub') actorUserId: string) {
    return this.ticketsService.findAllStatuses(actorUserId);
  }

  @Get('catalogos/prioridades')
  @ApiOperation({ summary: 'Listar prioridades de ticket' })
  @ApiOkResponse({ type: CatalogItemResponseDto, isArray: true })
  findAllPriorities(@CurrentUser('sub') actorUserId: string) {
    return this.ticketsService.findAllPriorities(actorUserId);
  }

  @Get('catalogos/categorias')
  @ApiOperation({ summary: 'Listar categorías de ticket' })
  @ApiOkResponse({ type: CatalogItemResponseDto, isArray: true })
  findAllCategories(@CurrentUser('sub') actorUserId: string) {
    return this.ticketsService.findAllCategories(actorUserId);
  }

  @Get('catalogos/estados-pago')
  @ApiOperation({ summary: 'Listar estados de pago' })
  @ApiOkResponse({ type: CatalogItemResponseDto, isArray: true })
  findAllPaymentStatuses(@CurrentUser('sub') actorUserId: string) {
    return this.ticketsService.findAllPaymentStatuses(actorUserId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets (oculta Borrador por defecto)' })
  @ApiBody({ type: FilterTicketsDto, required: false })
  @ApiOkResponse({ type: TicketResponseDto, isArray: true })
  findAll(
    @CurrentUser('sub') actorUserId: string,
    @Body() filters: FilterTicketsDto = {},
  ) {
    return this.ticketsService.findAll(actorUserId, filters);
  }

  @Get('detalle')
  @ApiOperation({ summary: 'Obtener ticket por ID' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: TicketResponseDto })
  findOne(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.ticketsService.findById(actorUserId, dto.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear ticket' })
  @ApiBody({ type: CreateTicketDto })
  @ApiCreatedResponse({ type: TicketResponseDto })
  create(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.create(actorUserId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ticket (sin cambio de estado)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateTicketDto })
  @ApiOkResponse({ type: TicketResponseDto })
  update(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(actorUserId, id, dto);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado del ticket' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: ChangeTicketStatusDto })
  @ApiOkResponse({ type: TicketResponseDto })
  changeStatus(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeTicketStatusDto,
  ) {
    return this.ticketsService.changeStatus(actorUserId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Mover ticket a Borrador (eliminación lógica)',
    description: 'No borra el registro; queda oculto en listados.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TicketResponseDto })
  moveToDraft(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ticketsService.moveToDraft(id, actorUserId);
  }

  @Get('historial-estados')
  @ApiOperation({ summary: 'Historial de estados del ticket' })
  @ApiBody({ type: GetTicketStatusHistoryDto })
  @ApiOkResponse({ type: TicketStatusHistoryResponseDto, isArray: true })
  getStatusHistory(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: GetTicketStatusHistoryDto,
  ) {
    return this.ticketsService.getStatusHistory(actorUserId, dto.ticketId);
  }

  @Get('comentarios')
  @ApiOperation({ summary: 'Listar comentarios del ticket (incluye internos)' })
  @ApiBody({ type: GetTicketCommentsDto })
  @ApiOkResponse({ type: TicketCommentResponseDto, isArray: true })
  getComments(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: GetTicketCommentsDto,
  ) {
    return this.ticketsService.getComments(actorUserId, dto.ticketId);
  }

  @Post('comentarios')
  @ApiOperation({ summary: 'Agregar comentario al ticket' })
  @ApiBody({ type: CreateTicketCommentDto })
  @ApiCreatedResponse({ type: TicketCommentResponseDto })
  addComment(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: CreateTicketCommentDto,
  ) {
    return this.ticketsService.addComment(actorUserId, dto);
  }

  @Get('archivos')
  @ApiOperation({ summary: 'Listar archivos del ticket' })
  @ApiBody({ type: GetTicketAssetsDto })
  @ApiOkResponse({ type: AssetResponseDto, isArray: true })
  getAssets(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: GetTicketAssetsDto,
  ) {
    return this.ticketsService.getTicketAssets(actorUserId, dto.ticketId);
  }

  @Post('vincular-archivo')
  @ApiOperation({ summary: 'Vincular asset existente al ticket' })
  @ApiBody({ type: LinkTicketAssetDto })
  @ApiOkResponse({ description: 'Vinculado' })
  linkAsset(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: LinkTicketAssetDto,
  ) {
    return this.ticketsService.linkAsset(actorUserId, dto.ticketId, dto.assetId);
  }

  @Post('desvincular-archivo')
  @ApiOperation({ summary: 'Desvincular asset del ticket' })
  @ApiBody({ type: UnlinkTicketAssetDto })
  @ApiOkResponse({ description: 'Desvinculado' })
  unlinkAsset(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: UnlinkTicketAssetDto,
  ) {
    return this.ticketsService.unlinkAsset(actorUserId, dto.ticketId, dto.assetId);
  }

  @Post('subir-archivo')
  @ApiOperation({ summary: 'Subir archivo a R2 y vincularlo al ticket' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'ticketId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        ticketId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiCreatedResponse({ type: AssetResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadAsset(
    @CurrentUser('sub') actorUserId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadTicketAssetDto,
  ) {
    return this.ticketsService.uploadAssetToTicket(actorUserId, dto.ticketId, file);
  }

  @Get('comentarios/archivos')
  @ApiOperation({ summary: 'Listar archivos de un comentario' })
  @ApiBody({ type: GetCommentAssetsDto })
  @ApiOkResponse({ type: AssetResponseDto, isArray: true })
  getCommentAssets(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: GetCommentAssetsDto,
  ) {
    return this.ticketsService.getCommentAssets(actorUserId, dto.ticketCommentId);
  }

  @Post('comentarios/vincular-archivo')
  @ApiOperation({ summary: 'Vincular asset a comentario' })
  @ApiBody({ type: LinkCommentAssetDto })
  @ApiOkResponse({ description: 'Vinculado' })
  linkCommentAsset(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: LinkCommentAssetDto,
  ) {
    return this.ticketsService.linkAssetToComment(
      actorUserId,
      dto.ticketCommentId,
      dto.assetId,
    );
  }

  @Post('comentarios/desvincular-archivo')
  @ApiOperation({ summary: 'Desvincular asset de comentario' })
  @ApiBody({ type: UnlinkCommentAssetDto })
  @ApiOkResponse({ description: 'Desvinculado' })
  unlinkCommentAsset(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: UnlinkCommentAssetDto,
  ) {
    return this.ticketsService.unlinkAssetFromComment(
      actorUserId,
      dto.ticketCommentId,
      dto.assetId,
    );
  }

  @Post('comentarios/subir-archivo')
  @ApiOperation({ summary: 'Subir archivo y vincularlo a comentario' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'ticketCommentId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        ticketCommentId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiCreatedResponse({ type: AssetResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadCommentAsset(
    @CurrentUser('sub') actorUserId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadCommentAssetDto,
  ) {
    return this.ticketsService.uploadAssetToComment(
      actorUserId,
      dto.ticketCommentId,
      file,
    );
  }
}

@ApiBearerAuth('access-token')
@AuthorizeSurface('portal')
@AuthorizeResource('tickets')
@ApiTags('Tickets — Portal')
@Controller('portal/tickets')
export class PortalTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar tickets del cliente',
    description: 'Solo tickets de proyectos de empresas del usuario autenticado.',
  })
  @ApiBody({ type: PortalFilterTicketsDto, required: false })
  @ApiOkResponse({ type: TicketResponseDto, isArray: true })
  findAll(
    @CurrentUser('sub') userId: string,
    @Body() dto: PortalFilterTicketsDto = {},
  ) {
    return this.ticketsService.findAllForPortal(userId, dto.projectId);
  }

  @Get('detalle')
  @ApiOperation({ summary: 'Obtener ticket por ID (portal)' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: TicketResponseDto })
  findOne(
    @CurrentUser('sub') userId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.ticketsService.findByIdForPortal(userId, dto.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear ticket desde portal' })
  @ApiBody({ type: PortalCreateTicketDto })
  @ApiCreatedResponse({ type: TicketResponseDto })
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: PortalCreateTicketDto,
  ) {
    return this.ticketsService.createForPortal(userId, dto);
  }

  @Get('comentarios')
  @ApiOperation({
    summary: 'Listar comentarios públicos del ticket (portal)',
    description: 'Excluye comentarios marcados como internos.',
  })
  @ApiBody({ type: GetTicketCommentsDto })
  @ApiOkResponse({ type: TicketCommentResponseDto, isArray: true })
  getComments(
    @CurrentUser('sub') userId: string,
    @Body() dto: GetTicketCommentsDto,
  ) {
    return this.ticketsService.getCommentsForPortal(userId, dto.ticketId);
  }

  @Post('comentarios')
  @ApiOperation({ summary: 'Agregar comentario público (portal)' })
  @ApiBody({ type: PortalCreateTicketCommentDto })
  @ApiCreatedResponse({ type: TicketCommentResponseDto })
  addComment(
    @CurrentUser('sub') userId: string,
    @Body() dto: PortalCreateTicketCommentDto,
  ) {
    return this.ticketsService.addCommentForPortal(userId, dto);
  }
}
