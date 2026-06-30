import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthorizeResource,
  AuthorizeSurface,
} from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FindByIdDto } from '../common/dto/find-by-id.dto';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateLegalRepresentativeDto } from './dto/create-legal-representative.dto';
import { UpdateLegalRepresentativeDto } from './dto/update-legal-representative.dto';
import { LinkRepresentativeDto } from './dto/link-representative.dto';
import { GetCompanyRepresentativesDto } from './dto/get-company-representatives.dto';
import {
  CompanyRepresentativeResponseDto,
  CompanyResponseDto,
  LegalRepresentativeResponseDto,
} from './dto/responses/companies-response.dto';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('companies')
@ApiTags('Companies — Internal')
@Controller('internal/companies')
export class InternalCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empresas activas' })
  @ApiOkResponse({ type: CompanyResponseDto, isArray: true })
  findAll(@CurrentUser('sub') actorUserId: string) {
    return this.companiesService.findAll(actorUserId);
  }

  @Get('detalle')
  @ApiOperation({
    summary: 'Obtener empresa por ID',
    description: 'Los GET con filtros reciben datos por body, no por URL.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: CompanyResponseDto })
  findOne(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.companiesService.findById(actorUserId, dto.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear empresa' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiCreatedResponse({ type: CompanyResponseDto })
  create(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(actorUserId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar empresa' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiOkResponse({ type: CompanyResponseDto })
  update(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(actorUserId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar empresa (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CompanyResponseDto })
  deactivate(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.companiesService.deactivate(actorUserId, id);
  }

  @Get('representantes')
  @ApiOperation({
    summary: 'Listar representantes de una empresa',
    description: 'Recibe companyId por body.',
  })
  @ApiBody({ type: GetCompanyRepresentativesDto })
  @ApiOkResponse({ type: CompanyRepresentativeResponseDto, isArray: true })
  getRepresentatives(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: GetCompanyRepresentativesDto,
  ) {
    return this.companiesService.getCompanyRepresentatives(
      actorUserId,
      dto.companyId,
    );
  }

  @Post(':id/representatives')
  @ApiOperation({ summary: 'Vincular representante legal a empresa' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID de la empresa' })
  @ApiBody({ type: LinkRepresentativeDto })
  @ApiCreatedResponse({ type: CompanyRepresentativeResponseDto })
  linkRepresentative(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkRepresentativeDto,
  ) {
    return this.companiesService.linkRepresentativeToCompany(
      actorUserId,
      id,
      dto,
    );
  }

  @Delete(':id/representatives/:legalRepresentativeId')
  @ApiOperation({ summary: 'Desvincular representante de empresa' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'legalRepresentativeId', format: 'uuid' })
  @ApiOkResponse({ description: 'Sin contenido' })
  unlinkRepresentative(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('legalRepresentativeId', ParseUUIDPipe) legalRepresentativeId: string,
  ) {
    return this.companiesService.unlinkRepresentativeFromCompany(
      actorUserId,
      id,
      legalRepresentativeId,
    );
  }
}

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('companies')
@ApiTags('Companies — Internal')
@Controller('internal/legal-representatives')
export class InternalLegalRepresentativesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar representantes legales' })
  @ApiOkResponse({ type: LegalRepresentativeResponseDto, isArray: true })
  findAll(@CurrentUser('sub') actorUserId: string) {
    return this.companiesService.findAllLegalRepresentatives(actorUserId);
  }

  @Get('detalle')
  @ApiOperation({
    summary: 'Obtener representante legal por ID',
    description: 'Recibe id por body.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: LegalRepresentativeResponseDto })
  findOne(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.companiesService.findLegalRepresentativeById(actorUserId, dto.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear representante legal' })
  @ApiBody({ type: CreateLegalRepresentativeDto })
  @ApiCreatedResponse({ type: LegalRepresentativeResponseDto })
  create(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: CreateLegalRepresentativeDto,
  ) {
    return this.companiesService.createLegalRepresentative(actorUserId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar representante legal' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateLegalRepresentativeDto })
  @ApiOkResponse({ type: LegalRepresentativeResponseDto })
  update(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLegalRepresentativeDto,
  ) {
    return this.companiesService.updateLegalRepresentative(actorUserId, id, dto);
  }
}

@ApiBearerAuth('access-token')
@AuthorizeSurface('portal')
@AuthorizeResource('companies')
@ApiTags('Companies — Portal')
@Controller('portal/companies')
export class PortalCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar empresas del cliente',
    description: 'Solo empresas vinculadas al usuario autenticado.',
  })
  @ApiOkResponse({ type: CompanyResponseDto, isArray: true })
  findAll(@CurrentUser('sub') userId: string) {
    return this.companiesService.findAllForPortal(userId);
  }

  @Get('detalle')
  @ApiOperation({ summary: 'Obtener empresa del cliente por ID' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: CompanyResponseDto })
  findOne(
    @CurrentUser('sub') userId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.companiesService.findByIdForPortal(userId, dto.id);
  }
}
