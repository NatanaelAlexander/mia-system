import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthorizeSurface } from './decorators/authorize.decorator';
import { RequirePermissions } from './decorators/require-permissions.decorator';
import { Permission } from './permissions/permission.constants';
import { AuthAdminService } from './auth-admin.service';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@ApiTags('Auth — Admin')
@Controller('internal/admin/authorization')
export class AuthAdminController {
  constructor(private readonly authAdminService: AuthAdminService) {}

  @Get('permissions')
  @RequirePermissions(Permission.PermissionsRead)
  @ApiOperation({ summary: 'Listar permisos del sistema' })
  listPermissions() {
    return this.authAdminService.listPermissions();
  }

  @Get('verify')
  @RequirePermissions(Permission.SystemManage)
  @ApiOperation({
    summary: 'Verificar salud de roles y permisos',
    description:
      'Herramienta operativa (patrón edificio-alcazar). Requiere system:manage.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        roles: 3,
        permissions: 38,
        usersWithoutRoles: 0,
        usersWithoutPermissions: 0,
        adminRolePermissionCount: 30,
        superAdminRolePermissionCount: 37,
        healthy: true,
        warnings: [],
      },
    },
  })
  verify() {
    return this.authAdminService.verifyAuthorizationHealth();
  }
}
