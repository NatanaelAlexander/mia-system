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
  AuthorizeAction,
  AuthorizeResource,
  AuthorizeSurface,
} from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { FindByIdDto } from '../common/dto/find-by-id.dto';
import {
  CreateQuoteDto,
  FilterQuotesDto,
  SetQuoteStatusesDto,
  ToggleShareDto,
  UpdateQuoteDto,
  UploadSignedDocumentDto,
} from './dto/quote.dto';
import {
  CreateQuotePresetDto,
  FilterQuotePresetsDto,
  UpdateQuotePresetDto,
} from './dto/quote-preset.dto';
import { QuotesService } from './quotes.service';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('quotes')
@ApiTags('Quotes — Internal')
@Controller('internal/quotes')
export class InternalQuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('emisores')
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar emisores activos de cotizaciones' })
  @ApiOkResponse({ description: 'Emisores' })
  listIssuers(@CurrentUser('sub') actorUserId: string) {
    return this.quotesService.listIssuers(actorUserId);
  }

  @Get('estados')
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Catálogo de estados de cotización' })
  listStatuses(@CurrentUser('sub') actorUserId: string) {
    return this.quotesService.listStatusCatalog(actorUserId);
  }

  @Post('presets/listar')
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar presets de cotización' })
  @ApiBody({ type: FilterQuotePresetsDto, required: false })
  listPresets(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: FilterQuotePresetsDto = {},
  ) {
    return this.quotesService.listPresets(actorUserId, dto.companyId);
  }

  @Post('presets')
  @ApiOperation({ summary: 'Crear preset de cotización' })
  @ApiBody({ type: CreateQuotePresetDto })
  createPreset(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: CreateQuotePresetDto,
  ) {
    return this.quotesService.createPreset(actorUserId, dto);
  }

  @Patch('presets/:id')
  @ApiOperation({ summary: 'Actualizar preset de cotización' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateQuotePresetDto })
  updatePreset(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuotePresetDto,
  ) {
    return this.quotesService.updatePreset(actorUserId, id, dto);
  }

  @Delete('presets/:id')
  @ApiOperation({ summary: 'Eliminar preset de cotización' })
  @ApiParam({ name: 'id', format: 'uuid' })
  deletePreset(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.deletePreset(actorUserId, id);
  }

  @Post('listar')
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar cotizaciones con filtros' })
  @ApiBody({ type: FilterQuotesDto, required: false })
  listWithFilters(
    @CurrentUser('sub') actorUserId: string,
    @Body() filters: FilterQuotesDto = {},
  ) {
    return this.quotesService.findAllFiltered(actorUserId, filters);
  }

  @Post('detalle')
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Obtener cotización por ID' })
  @ApiBody({ type: FindByIdDto })
  findOneByBody(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.quotesService.findById(actorUserId, dto.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cotización' })
  @ApiBody({ type: CreateQuoteDto })
  @ApiCreatedResponse({ description: 'Cotización creada' })
  create(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.create(actorUserId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cotización' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateQuoteDto })
  update(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(actorUserId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cotización' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.remove(actorUserId, id);
  }

  @Post(':id/enviar')
  @AuthorizeAction('send')
  @ApiOperation({
    summary: 'Enviar cotización (activa link 24h y notifica al cliente)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  send(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.send(actorUserId, id);
  }

  @Post(':id/enlace')
  @AuthorizeAction('send')
  @ApiOperation({
    summary: 'Habilitar o deshabilitar enlace público (habilitar reinicia 24h)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: ToggleShareDto })
  toggleShare(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ToggleShareDto,
  ) {
    return this.quotesService.toggleShare(actorUserId, id, dto.enabled);
  }

  @Post(':id/estados')
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Reemplazar estados activos de la cotización' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: SetQuoteStatusesDto })
  setStatuses(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetQuoteStatusesDto,
  ) {
    return this.quotesService.setStatuses(actorUserId, id, dto.statusCodes);
  }

  @Post(':id/documento-firmado')
  @AuthorizeAction('update')
  @ApiOperation({
    summary: 'Subir documento firmado (máximo 1 archivo por cotización)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        displayName: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadSignedDocument(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadSignedDocumentDto,
  ) {
    return this.quotesService.uploadSignedDocument(
      actorUserId,
      id,
      file,
      dto.displayName,
    );
  }

  @Delete(':id/documento-firmado')
  @AuthorizeAction('update')
  @ApiOperation({ summary: 'Eliminar documento firmado de la cotización' })
  @ApiParam({ name: 'id', format: 'uuid' })
  removeSignedDocument(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.quotesService.removeSignedDocument(actorUserId, id);
  }
}

@Public()
@ApiTags('Quotes — Public')
@Controller('public/quotes')
export class PublicQuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Revisar cotización por token público (válido 24h)',
  })
  @ApiParam({ name: 'token' })
  findByToken(@Param('token') token: string) {
    return this.quotesService.findByPublicToken(token);
  }
}
