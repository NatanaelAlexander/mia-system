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
  AuthorizeAction,
} from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
import { PortalFilterProjectsDto } from './dto/portal-filter-projects.dto';
import { FilterProjectsDto } from './dto/filter-projects.dto';
import { ProjectsService } from './projects.service';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('projects')
@ApiTags('Projects — Internal')
@Controller('internal/projects')
export class InternalProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar proyectos activos',
    description: 'Solo activos. Para filtros usar POST /listar.',
  })
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  findAll(@CurrentUser('sub') actorUserId: string) {
    return this.projectsService.findAllActive(actorUserId);
  }

  @Post('listar')
  @AuthorizeAction('read')
  @ApiOperation({
    summary: 'Listar proyectos con filtros',
    description: 'Filtra por estado. Sin filtro devuelve todos los estados.',
  })
  @ApiBody({ type: FilterProjectsDto, required: false })
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  listWithFilters(
    @CurrentUser('sub') actorUserId: string,
    @Body() filters: FilterProjectsDto = {},
  ) {
    return this.projectsService.findAllFiltered(actorUserId, filters);
  }

  @Get('detalle')
  @ApiOperation({
    summary: 'Obtener proyecto por ID',
    description: 'Recibe el id por body. En navegador usar POST /detalle.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ProjectResponseDto })
  findOne(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.projectsService.findById(actorUserId, dto.id);
  }

  @Post('detalle')
  @AuthorizeAction('read')
  @ApiOperation({
    summary: 'Obtener proyecto por ID (body)',
    description: 'Equivalente a GET /detalle para clientes web.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ProjectResponseDto })
  findOneByBody(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.projectsService.findById(actorUserId, dto.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear proyecto' })
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({ type: ProjectResponseDto })
  create(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(actorUserId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proyecto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiOkResponse({ type: ProjectResponseDto })
  update(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(actorUserId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar proyecto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProjectResponseDto })
  deactivate(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectsService.deactivate(actorUserId, id);
  }

  @Get('archivos')
  @ApiOperation({
    summary: 'Listar archivos del proyecto',
    description: 'En navegador usar POST /archivos/listar.',
  })
  @ApiBody({ type: GetProjectAssetsDto })
  @ApiOkResponse({ type: AssetResponseDto, isArray: true })
  getAssets(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: GetProjectAssetsDto,
  ) {
    return this.projectsService.getProjectAssets(actorUserId, dto.projectId);
  }

  @Post('archivos/listar')
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar archivos del proyecto (body)' })
  @ApiBody({ type: GetProjectAssetsDto })
  @ApiOkResponse({ type: AssetResponseDto, isArray: true })
  listAssets(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: GetProjectAssetsDto,
  ) {
    return this.projectsService.getProjectAssets(actorUserId, dto.projectId);
  }

  @Post('vincular-archivo')
  @ApiOperation({ summary: 'Vincular un asset existente al proyecto' })
  @ApiBody({ type: LinkProjectAssetDto })
  @ApiOkResponse({ description: 'Vinculado' })
  linkAsset(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: LinkProjectAssetDto,
  ) {
    return this.projectsService.linkAsset(actorUserId, dto.projectId, dto.assetId);
  }

  @Post('desvincular-archivo')
  @ApiOperation({ summary: 'Desvincular asset del proyecto (no borra el archivo)' })
  @ApiBody({ type: UnlinkProjectAssetDto })
  @ApiOkResponse({ description: 'Desvinculado' })
  unlinkAsset(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: UnlinkProjectAssetDto,
  ) {
    return this.projectsService.unlinkAsset(actorUserId, dto.projectId, dto.assetId);
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
        displayName: {
          type: 'string',
          description: 'Nombre visible opcional. Sin valor usa el nombre del archivo.',
        },
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
    @Body() dto: UploadProjectAssetDto,
  ) {
    return this.projectsService.uploadAssetToProject(
      actorUserId,
      dto.projectId,
      file,
      dto.displayName,
    );
  }
}

@ApiBearerAuth('access-token')
@AuthorizeSurface('portal')
@AuthorizeResource('projects')
@ApiTags('Projects — Portal')
@Controller('portal/projects')
export class PortalProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar proyectos del cliente',
    description: 'Solo proyectos de empresas vinculadas al usuario autenticado.',
  })
  @ApiBody({ type: PortalFilterProjectsDto, required: false })
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  findAll(
    @CurrentUser('sub') userId: string,
    @Body() dto: PortalFilterProjectsDto = {},
  ) {
    return this.projectsService.findAllForPortal(userId, dto);
  }

  @Post('listar')
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Listar proyectos del cliente (body)' })
  @ApiBody({ type: PortalFilterProjectsDto, required: false })
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  listWithFilters(
    @CurrentUser('sub') userId: string,
    @Body() dto: PortalFilterProjectsDto = {},
  ) {
    return this.projectsService.findAllForPortal(userId, dto);
  }

  @Get('detalle')
  @ApiOperation({
    summary: 'Obtener proyecto del cliente por ID',
    description: 'En navegador usar POST /detalle.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ProjectResponseDto })
  findOne(
    @CurrentUser('sub') userId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.projectsService.findByIdForPortal(userId, dto.id);
  }

  @Post('detalle')
  @AuthorizeAction('read')
  @ApiOperation({ summary: 'Obtener proyecto del cliente por ID (body)' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: ProjectResponseDto })
  findOneByBody(
    @CurrentUser('sub') userId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.projectsService.findByIdForPortal(userId, dto.id);
  }
}
