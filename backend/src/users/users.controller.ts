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
  AuthenticatedOnly,
  AuthorizeResource,
  AuthorizeSurface,
  AuthorizeAction,
} from '../auth/decorators/authorize.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FindByIdDto } from '../common/dto/find-by-id.dto';
import {
  AdminChangePasswordDto,
  AssignUserRolesDto,
  ChangePasswordDto,
  CreateUserDto,
  FilterUsersDto,
  LinkUserCompanyDto,
  LinkUserCompanyRequestDto,
  UpdateProfileDto,
  UpdateUserDto,
} from './dto/users.dto';
import {
  JobTitleOptionResponseDto,
  RoleOptionResponseDto,
  UserDetailResponseDto,
  UserResponseDto,
} from './dto/responses/user-response.dto';
import { UsersService } from './users.service';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('users')
@ApiTags('Users — Internal')
@Controller('internal/users')
export class InternalUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description: 'Filtros opcionales por body. En navegador usar POST /listar.',
  })
  @ApiBody({ type: FilterUsersDto, required: false })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  findAll(@Body() filters: FilterUsersDto = {}) {
    return this.usersService.findAll(filters);
  }

  @Post('listar')
  @AuthorizeAction('read')
  @ApiOperation({
    summary: 'Listar usuarios con filtros (body)',
    description: 'Equivalente a GET con filtros para clientes web.',
  })
  @ApiBody({ type: FilterUsersDto, required: false })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  listWithFilters(@Body() filters: FilterUsersDto = {}) {
    return this.usersService.findAll(filters);
  }

  @Get('detalle')
  @ApiOperation({
    summary: 'Obtener usuario por ID (con roles, cargos y empresas)',
    description: 'Recibe el id por body. En navegador usar POST /detalle.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.usersService.findById(dto.id);
  }

  @Post('detalle')
  @AuthorizeAction('read')
  @ApiOperation({
    summary: 'Obtener usuario por ID (body)',
    description: 'Equivalente a GET /detalle para clientes web.',
  })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  findOneByBody(@Body() dto: FindByIdDto) {
    return this.usersService.findById(dto.id);
  }

  @Get('catalogos/roles')
  @ApiOperation({ summary: 'Listar roles disponibles' })
  @ApiOkResponse({ type: RoleOptionResponseDto, isArray: true })
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Get('catalogos/cargos')
  @ApiOperation({ summary: 'Listar cargos laborales disponibles' })
  @ApiOkResponse({ type: JobTitleOptionResponseDto, isArray: true })
  findAllJobTitles() {
    return this.usersService.findAllJobTitles();
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ type: UserDetailResponseDto })
  create(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(dto, actorUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  update(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto, actorUserId, { asAdmin: true });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar usuario (no borra el registro)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  deactivate(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.deactivate(id, actorUserId);
  }

  @Patch(':id/roles')
  @ApiOperation({ summary: 'Reemplazar roles del usuario' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: AssignUserRolesDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  assignRoles(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignUserRolesDto,
  ) {
    return this.usersService.assignRoles(id, dto, actorUserId);
  }

  @Patch(':id/contrasena')
  @ApiOperation({ summary: 'Restablecer contraseña (admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: AdminChangePasswordDto })
  @ApiOkResponse({ description: 'Contraseña actualizada' })
  async adminChangePassword(
    @CurrentUser('sub') actorUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminChangePasswordDto,
  ) {
    await this.usersService.adminChangePassword(id, dto, actorUserId);
    return { ok: true };
  }

  @Post('vincular-empresa')
  @ApiOperation({ summary: 'Vincular usuario a empresa (portal cliente)' })
  @ApiBody({ type: LinkUserCompanyRequestDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  linkCompany(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: LinkUserCompanyRequestDto,
  ) {
    return this.usersService.linkCompany(dto.userId, dto, actorUserId);
  }

  @Post('desvincular-empresa')
  @ApiOperation({ summary: 'Desvincular usuario de empresa' })
  @ApiBody({ type: LinkUserCompanyRequestDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  unlinkCompany(
    @CurrentUser('sub') actorUserId: string,
    @Body() dto: LinkUserCompanyRequestDto,
  ) {
    return this.usersService.unlinkCompany(
      dto.userId,
      dto.companyId,
      actorUserId,
    );
  }
}

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthenticatedOnly()
@ApiTags('Users — Perfil')
@Controller('internal/users/perfil')
export class InternalUserProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Ver mi perfil' })
  @ApiOkResponse({ type: UserDetailResponseDto })
  getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('contrasena')
  @ApiOperation({ summary: 'Cambiar mi contraseña' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ description: 'Contraseña actualizada' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changeOwnPassword(userId, dto);
    return { ok: true };
  }
}

@ApiBearerAuth('access-token')
@AuthorizeSurface('portal')
@AuthenticatedOnly()
@ApiTags('Users — Portal')
@Controller('portal/users/perfil')
export class PortalUserProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Ver mi perfil (portal)' })
  @ApiOkResponse({ type: UserDetailResponseDto })
  getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar mi perfil (portal)' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ type: UserDetailResponseDto })
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('contrasena')
  @ApiOperation({ summary: 'Cambiar mi contraseña (portal)' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ description: 'Contraseña actualizada' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changeOwnPassword(userId, dto);
    return { ok: true };
  }
}
