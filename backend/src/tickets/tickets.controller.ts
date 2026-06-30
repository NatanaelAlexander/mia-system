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
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { FindByIdDto } from '../common/dto/find-by-id.dto';
import { AssetResponseDto } from '../assets/dto/responses/asset-response.dto';
import { ChangeTicketStatusDto } from './dto/change-ticket-status.dto';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { SoftDeleteTicketDto } from './dto/soft-delete-ticket.dto';
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
  CatalogItemResponseDto,
  TicketCommentResponseDto,
  TicketResponseDto,
  TicketStatusHistoryResponseDto,
} from './dto/responses/ticket-response.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets — Internal')
@Controller('internal/tickets')
export class InternalTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('catalogos/estados')
  @ApiOperation({ summary: 'Listar estados de ticket' })
  @ApiOkResponse({ type: CatalogItemResponseDto, isArray: true })
  findAllStatuses() {
    return this.ticketsService.findAllStatuses();
  }

  @Get('catalogos/prioridades')
  @ApiOperation({ summary: 'Listar prioridades de ticket' })
  @ApiOkResponse({ type: CatalogItemResponseDto, isArray: true })
  findAllPriorities() {
    return this.ticketsService.findAllPriorities();
  }

  @Get('catalogos/categorias')
  @ApiOperation({ summary: 'Listar categorías de ticket' })
  @ApiOkResponse({ type: CatalogItemResponseDto, isArray: true })
  findAllCategories() {
    return this.ticketsService.findAllCategories();
  }

  @Get('catalogos/estados-pago')
  @ApiOperation({ summary: 'Listar estados de pago' })
  @ApiOkResponse({ type: CatalogItemResponseDto, isArray: true })
  findAllPaymentStatuses() {
    return this.ticketsService.findAllPaymentStatuses();
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets (oculta Borrador por defecto)' })
  @ApiBody({ type: FilterTicketsDto, required: false })
  @ApiOkResponse({ type: TicketResponseDto, isArray: true })
  findAll(@Body() filters: FilterTicketsDto = {}) {
    return this.ticketsService.findAll(filters);
  }

  @Get('detalle')
  @ApiOperation({ summary: 'Obtener ticket por ID' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: TicketResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.ticketsService.findById(dto.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear ticket' })
  @ApiBody({ type: CreateTicketDto })
  @ApiCreatedResponse({ type: TicketResponseDto })
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ticket (sin cambio de estado)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateTicketDto })
  @ApiOkResponse({ type: TicketResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, dto);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado del ticket' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: ChangeTicketStatusDto })
  @ApiOkResponse({ type: TicketResponseDto })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeTicketStatusDto,
  ) {
    return this.ticketsService.changeStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Mover ticket a Borrador (eliminación lógica)',
    description: 'No borra el registro; queda oculto en listados.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: SoftDeleteTicketDto })
  @ApiOkResponse({ type: TicketResponseDto })
  moveToDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SoftDeleteTicketDto,
  ) {
    return this.ticketsService.moveToDraft(id, dto.userId);
  }

  @Get('historial-estados')
  @ApiOperation({ summary: 'Historial de estados del ticket' })
  @ApiBody({ type: GetTicketStatusHistoryDto })
  @ApiOkResponse({ type: TicketStatusHistoryResponseDto, isArray: true })
  getStatusHistory(@Body() dto: GetTicketStatusHistoryDto) {
    return this.ticketsService.getStatusHistory(dto.ticketId);
  }

  @Get('comentarios')
  @ApiOperation({ summary: 'Listar comentarios del ticket' })
  @ApiBody({ type: GetTicketCommentsDto })
  @ApiOkResponse({ type: TicketCommentResponseDto, isArray: true })
  getComments(@Body() dto: GetTicketCommentsDto) {
    return this.ticketsService.getComments(dto.ticketId);
  }

  @Post('comentarios')
  @ApiOperation({ summary: 'Agregar comentario al ticket' })
  @ApiBody({ type: CreateTicketCommentDto })
  @ApiCreatedResponse({ type: TicketCommentResponseDto })
  addComment(@Body() dto: CreateTicketCommentDto) {
    return this.ticketsService.addComment(dto);
  }

  @Get('archivos')
  @ApiOperation({ summary: 'Listar archivos del ticket' })
  @ApiBody({ type: GetTicketAssetsDto })
  @ApiOkResponse({ type: AssetResponseDto, isArray: true })
  getAssets(@Body() dto: GetTicketAssetsDto) {
    return this.ticketsService.getTicketAssets(dto.ticketId);
  }

  @Post('vincular-archivo')
  @ApiOperation({ summary: 'Vincular asset existente al ticket' })
  @ApiBody({ type: LinkTicketAssetDto })
  @ApiOkResponse({ description: 'Vinculado' })
  linkAsset(@Body() dto: LinkTicketAssetDto) {
    return this.ticketsService.linkAsset(dto.ticketId, dto.assetId);
  }

  @Post('desvincular-archivo')
  @ApiOperation({ summary: 'Desvincular asset del ticket' })
  @ApiBody({ type: UnlinkTicketAssetDto })
  @ApiOkResponse({ description: 'Desvinculado' })
  unlinkAsset(@Body() dto: UnlinkTicketAssetDto) {
    return this.ticketsService.unlinkAsset(dto.ticketId, dto.assetId);
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
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadTicketAssetDto,
  ) {
    return this.ticketsService.uploadAssetToTicket(dto.ticketId, file);
  }

  @Get('comentarios/archivos')
  @ApiOperation({ summary: 'Listar archivos de un comentario' })
  @ApiBody({ type: GetCommentAssetsDto })
  @ApiOkResponse({ type: AssetResponseDto, isArray: true })
  getCommentAssets(@Body() dto: GetCommentAssetsDto) {
    return this.ticketsService.getCommentAssets(dto.ticketCommentId);
  }

  @Post('comentarios/vincular-archivo')
  @ApiOperation({ summary: 'Vincular asset a comentario' })
  @ApiBody({ type: LinkCommentAssetDto })
  @ApiOkResponse({ description: 'Vinculado' })
  linkCommentAsset(@Body() dto: LinkCommentAssetDto) {
    return this.ticketsService.linkAssetToComment(
      dto.ticketCommentId,
      dto.assetId,
    );
  }

  @Post('comentarios/desvincular-archivo')
  @ApiOperation({ summary: 'Desvincular asset de comentario' })
  @ApiBody({ type: UnlinkCommentAssetDto })
  @ApiOkResponse({ description: 'Desvinculado' })
  unlinkCommentAsset(@Body() dto: UnlinkCommentAssetDto) {
    return this.ticketsService.unlinkAssetFromComment(
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
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadCommentAssetDto,
  ) {
    return this.ticketsService.uploadAssetToComment(dto.ticketCommentId, file);
  }
}

@ApiTags('Tickets — Portal')
@Controller('portal/tickets')
export class PortalTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar tickets del cliente',
    description: 'Pendiente auth: filtrar por empresa/proyecto del usuario.',
  })
  @ApiBody({ type: FilterTicketsDto, required: false })
  @ApiOkResponse({ type: TicketResponseDto, isArray: true })
  findAll(@Body() filters: FilterTicketsDto = {}) {
    return this.ticketsService.findAllForPortal(filters);
  }

  @Get('detalle')
  @ApiOperation({ summary: 'Obtener ticket por ID (portal)' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: TicketResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.ticketsService.findByIdForPortal(dto.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear ticket desde portal' })
  @ApiBody({ type: CreateTicketDto })
  @ApiCreatedResponse({ type: TicketResponseDto })
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Get('comentarios')
  @ApiOperation({ summary: 'Listar comentarios del ticket (portal)' })
  @ApiBody({ type: GetTicketCommentsDto })
  @ApiOkResponse({ type: TicketCommentResponseDto, isArray: true })
  getComments(@Body() dto: GetTicketCommentsDto) {
    return this.ticketsService.getCommentsForPortal(dto.ticketId);
  }

  @Post('comentarios')
  @ApiOperation({ summary: 'Agregar comentario (portal)' })
  @ApiBody({ type: CreateTicketCommentDto })
  @ApiCreatedResponse({ type: TicketCommentResponseDto })
  addComment(@Body() dto: CreateTicketCommentDto) {
    return this.ticketsService.addCommentForPortal(dto);
  }
}
