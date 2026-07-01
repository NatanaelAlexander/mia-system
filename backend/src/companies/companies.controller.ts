import {
  Body,
  Controller,
  Delete,
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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthorizeResource,
  AuthorizeSurface,
  AuthorizeAction,
} from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FindByIdDto } from '../common/dto/find-by-id.dto';
import { CompaniesService } from './companies.service';
import { UsersService } from '../users/users.service';
import { LinkUserToCompanyDto } from './dto/link-user-to-company.dto';
import { UserDetailResponseDto } from '../users/dto/responses/user-response.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateLegalRepresentativeDto } from './dto/create-legal-representative.dto';
import { UpdateLegalRepresentativeDto } from './dto/update-legal-representative.dto';
import { LinkRepresentativeDto } from './dto/link-representative.dto';
import { GetCompanyRepresentativesDto } from './dto/get-company-representatives.dto';
import { FilterCompaniesDto } from './dto/filter-companies.dto';
import { UpdateCompanyRepresentativeDto } from './dto/update-company-representative.dto';
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
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar empresas activas',
    description: 'Solo activas. Para filtros usar POST /listar.',
  })
  @ApiOkResponse({ type: CompanyResponseDto, isArray: true })
  findAll(@CurrentUser('sub') actorUserId: string) {
    return this.companiesService.findAll(actorUserId);
  }

  @Post('listar')
  @AuthorizeAction('read')
  @ApiOperation({
    summary: 'Listar empresas con filtros',
    description: 'Filtra por estado y búsqueda por nombre o RUT.',
  })
  @ApiBody({ type: FilterCompaniesDto, required: false })
  @ApiOkResponse({ type: CompanyResponseDto, isArray: true })
  listWithFilters(
    @CurrentUser('sub') actorUserId: string,
    @Body() filters: FilterCompaniesDto = {},
  ) {
    return this.companiesService.findAllFiltered(actorUserId, filters);
  }

  @Get('detalle')
  @ApiOperation({
    summary: 'Obtener empresa por ID',
    description: 'Recibe el id por body JSON. En navegador usar POST /detalle.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: CompanyResponseDto })
  findOne(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.companiesService.findById(actorUserId, dto.id);
  }

  @Post('detalle')
  @AuthorizeAction('read')
  @ApiOperation({
    summary: 'Obtener empresa por ID (body)',
    description: 'Equivalente a GET /detalle para clientes web.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: CompanyResponseDto })
  findOneByBody(
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

  @Post(':id/vincular-usuario')
  @ApiOperation({ summary: 'Asignar usuario a esta empresa' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID de la empresa' })
  @ApiBody({ type: LinkUserToCompanyDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  linkUser(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: LinkUserToCompanyDto,
  ) {
    return this.usersService.linkCompany(
      dto.userId,
      { companyId },
      actorUserId,
    );
  }

  @Post(':id/desvincular-usuario')
  @ApiOperation({ summary: 'Desasignar usuario de esta empresa' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID de la empresa' })
  @ApiBody({ type: LinkUserToCompanyDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  unlinkUser(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: LinkUserToCompanyDto,
  ) {
    return this.usersService.unlinkCompany(
      dto.userId,
      companyId,
      actorUserId,
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
  @HttpCode(HttpStatus.NO_CONTENT)
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

  @Patch(':id/representatives/:legalRepresentativeId')
  @ApiOperation({ summary: 'Actualizar cargo del representante en la empresa' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'legalRepresentativeId', format: 'uuid' })
  @ApiBody({ type: UpdateCompanyRepresentativeDto })
  @ApiOkResponse({ type: CompanyRepresentativeResponseDto })
  updateRepresentativeLink(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('legalRepresentativeId', ParseUUIDPipe) legalRepresentativeId: string,
    @Body() dto: UpdateCompanyRepresentativeDto,
  ) {
    return this.companiesService.updateCompanyRepresentative(
      actorUserId,
      id,
      legalRepresentativeId,
      dto,
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
  @ApiOperation({
    summary: 'Obtener empresa del cliente por ID',
    description: 'Recibe el id por body. En navegador usar POST /detalle.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: CompanyResponseDto })
  findOne(
    @CurrentUser('sub') userId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.companiesService.findByIdForPortal(userId, dto.id);
  }

  @Post('detalle')
  @AuthorizeAction('read')
  @ApiOperation({
    summary: 'Obtener empresa del cliente por ID (body)',
    description: 'Equivalente a GET /detalle para clientes web.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: CompanyResponseDto })
  findOneByBody(
    @CurrentUser('sub') userId: string,
    @Body() dto: FindByIdDto,
  ) {
    return this.companiesService.findByIdForPortal(userId, dto.id);
  }
}
