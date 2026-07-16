import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { loadAuthConfig } from './auth.config';
import { JWT_ALGORITHM } from './jwt-token.util';
import { AuthController } from './auth.controller';
import { AuthAdminController } from './auth-admin.controller';
import { AuthAdminService } from './auth-admin.service';
import { AuthService } from './auth.service';
import { RefreshSessionsService } from './refresh-sessions.service';
import { ApiAuthorizationGuard } from './guards/api-authorization.guard';
import { InternalSurfaceGuard } from './guards/internal-surface.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PortalSurfaceGuard } from './guards/portal-surface.guard';
import { WsJwtGuard } from './guards/ws-jwt.guard';
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
    RefreshSessionsService,
    ApiAuthorizationGuard,
    JwtAuthGuard,
    InternalSurfaceGuard,
    PortalSurfaceGuard,
    PermissionsGuard,
    WsJwtGuard,
  ],
  exports: [
    AuthService,
    PermissionsService,
    RefreshSessionsService,
    ApiAuthorizationGuard,
    JwtModule,
    JwtAuthGuard,
    InternalSurfaceGuard,
    PortalSurfaceGuard,
    PermissionsGuard,
    WsJwtGuard,
  ],
})
export class AuthModule {}
