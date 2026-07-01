import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  AuthorizeAction,
} from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FindByIdDto } from '../common/dto/find-by-id.dto';
import { AssetsService } from './assets.service';
import {
  AssetDownloadUrlResponseDto,
  AssetResponseDto,
} from './dto/responses/asset-response.dto';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('assets')
@ApiTags('Assets — Internal')
@Controller('internal/assets')
export class InternalAssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar archivos (metadata)' })
  @ApiOkResponse({ type: AssetResponseDto, isArray: true })
  findAll() {
    return this.assetsService.findAll();
  }

  @Get('detalle')
  @ApiOperation({ summary: 'Obtener archivo por ID (metadata)' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: AssetResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.assetsService.findById(dto.id);
  }

  @Get('descarga')
  @ApiOperation({
    summary: 'URL firmada temporal para descargar',
    description: 'Bucket privado. El backend valida y devuelve URL de corta duración.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: AssetDownloadUrlResponseDto })
  getDownloadUrl(@Body() dto: FindByIdDto) {
    return this.assetsService.getDownloadUrl(dto.id);
  }

  @Post('descarga')
  @AuthorizeAction('read')
  @ApiOperation({
    summary: 'URL firmada temporal para descargar (body)',
    description: 'Equivalente a GET /descarga para clientes web.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: AssetDownloadUrlResponseDto })
  getDownloadUrlByBody(@Body() dto: FindByIdDto) {
    return this.assetsService.getDownloadUrl(dto.id);
  }

  @Post('subir')
  @ApiOperation({
    summary: 'Subir archivo a R2 (sin vincular a proyecto)',
    description: 'Para vincular a un proyecto usa POST /internal/projects/subir-archivo',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
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
  upload(
    @CurrentUser('sub') actorUserId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assetsService.uploadStandaloneFile(file, actorUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar archivo (R2 + BD)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Eliminado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.assetsService.delete(id);
  }
}
