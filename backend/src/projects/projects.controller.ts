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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  GetProjectAssetsDto,
  LinkProjectAssetDto,
  UnlinkProjectAssetDto,
  UploadProjectAssetDto,
} from './dto/project-assets.dto';
import { ProjectResponseDto } from './dto/responses/project-response.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects — Internal')
@Controller('internal/projects')
export class InternalProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar proyectos activos' })
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  findAll() {
    return this.projectsService.findAllActive();
  }

  @Get('detalle')
  @ApiOperation({ summary: 'Obtener proyecto por ID' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ProjectResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.projectsService.findById(dto.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear proyecto' })
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({ type: ProjectResponseDto })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proyecto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiOkResponse({ type: ProjectResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar proyecto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProjectResponseDto })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.deactivate(id);
  }

  @Get('archivos')
  @ApiOperation({ summary: 'Listar archivos del proyecto' })
  @ApiBody({ type: GetProjectAssetsDto })
  @ApiOkResponse({ type: AssetResponseDto, isArray: true })
  getAssets(@Body() dto: GetProjectAssetsDto) {
    return this.projectsService.getProjectAssets(dto.projectId);
  }

  @Post('vincular-archivo')
  @ApiOperation({ summary: 'Vincular un asset existente al proyecto' })
  @ApiBody({ type: LinkProjectAssetDto })
  @ApiOkResponse({ description: 'Vinculado' })
  linkAsset(@Body() dto: LinkProjectAssetDto) {
    return this.projectsService.linkAsset(dto.projectId, dto.assetId);
  }

  @Post('desvincular-archivo')
  @ApiOperation({ summary: 'Desvincular asset del proyecto (no borra el archivo)' })
  @ApiBody({ type: UnlinkProjectAssetDto })
  @ApiOkResponse({ description: 'Desvinculado' })
  unlinkAsset(@Body() dto: UnlinkProjectAssetDto) {
    return this.projectsService.unlinkAsset(dto.projectId, dto.assetId);
  }

  @Post('subir-archivo')
  @ApiOperation({
    summary: 'Subir archivo a R2 y vincularlo al proyecto',
    description: 'Sube a bucket privado, guarda metadata en assets y crea projects_assets.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'projectId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        projectId: { type: 'string', format: 'uuid' },
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
    @Body() dto: UploadProjectAssetDto,
  ) {
    return this.projectsService.uploadAssetToProject(dto.projectId, file);
  }
}

@ApiTags('Projects — Portal')
@Controller('portal/projects')
export class PortalProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /** Pendiente auth: filtrar por empresa del usuario */
  @Get()
  @ApiOperation({ summary: 'Listar proyectos (portal)' })
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  findAll() {
    return this.projectsService.findAllForPortal();
  }
}
