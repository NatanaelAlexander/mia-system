import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { loadAuthConfig } from './auth.config';
import { JWT_ALGORITHM } from './jwt-token.util';
import { AuthController } from './auth.controller';
import { AuthAdminController } from './auth-admin.controller';
import { AuthAdminService } from './auth-admin.service';
import { AuthService } from './auth.service';
import { ApiAuthorizationGuard } from './guards/api-authorization.guard';
import { InternalSurfaceGuard } from './guards/internal-surface.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PortalSurfaceGuard } from './guards/portal-surface.guard';
import { PermissionsService } from './permissions/permissions.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: loadAuthConfig().accessSecret || undefined,
      signOptions: { algorithm: JWT_ALGORITHM },
    }),
  ],
  controllers: [AuthController, AuthAdminController],
  providers: [
    AuthService,
    AuthAdminService,
    PermissionsService,
    ApiAuthorizationGuard,
    JwtAuthGuard,
    InternalSurfaceGuard,
    PortalSurfaceGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    PermissionsService,
    ApiAuthorizationGuard,
    JwtModule,
    JwtAuthGuard,
    InternalSurfaceGuard,
    PortalSurfaceGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
