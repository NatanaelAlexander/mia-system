import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../common/database/database.service';
import {
  AuthConfig,
  isAuthConfigured,
  loadAuthConfig,
  parseExpiresInToSeconds,
  resolveAccessExpiresIn,
} from './auth.config';
import {
  AuthNoConfiguradoException,
  CredencialesInvalidasException,
  RefreshTokenInvalidoException,
  TokenAccesoInvalidoException,
} from './exceptions/auth.exceptions';
import {
  accessTokenSignOptions,
  accessTokenVerifyOptions,
  assertAccessTokenPayload,
  assertRefreshTokenPayload,
  refreshTokenSignOptions,
  refreshTokenVerifyOptions,
} from './jwt-token.util';
import { PermissionsService } from './permissions/permissions.service';
import { RefreshSessionsService } from './refresh-sessions.service';
import {
  SQL_FIND_USER_BY_EMAIL_AND_PASSWORD,
  SQL_FIND_USER_BY_ID_ACTIVE,
} from './queries/auth.queries';
import {
  AuthLoginResult,
  AuthTokens,
  AuthUser,
  JwtAccessPayload,
  JwtRefreshPayload,
} from './types/auth.types';
import { SessionClientContext } from './types/refresh-session.types';

const LOGIN_FAILURE_DELAY_MS = 400;

@Injectable()
export class AuthService implements OnModuleInit {
  private config: AuthConfig = loadAuthConfig();

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
    private readonly refreshSessions: RefreshSessionsService,
  ) {}

  onModuleInit(): void {
    this.config = loadAuthConfig();
  }

  async verifyAccessToken(token: string): Promise<JwtAccessPayload> {
    this.ensureConfigured();

    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        accessTokenVerifyOptions(this.config.accessSecret),
      );

      assertAccessTokenPayload(payload);

      return payload;
    } catch (error) {
      if (error instanceof TokenAccesoInvalidoException) {
        throw error;
      }
      throw new TokenAccesoInvalidoException();
    }
  }

  async login(
    email: string,
    password: string,
    context: SessionClientContext = {},
  ): Promise<AuthLoginResult> {
    this.ensureConfigured();

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.findUserByCredentials(normalizedEmail, password);

    if (!user || !user.isActive) {
      await this.delay(LOGIN_FAILURE_DELAY_MS);
      throw new CredencialesInvalidasException();
    }

    this.permissionsService.invalidateUser(user.id);
    const authorization = await this.permissionsService.resolveAuthorization(
      user.id,
    );

    if (!authorization) {
      throw new CredencialesInvalidasException();
    }

    const tokens = await this.issueTokens(user, authorization, context);

    return {
      ...tokens,
      user: this.buildUserResponse(user, authorization),
    };
  }

  async refresh(
    refreshToken: string,
    context: SessionClientContext = {},
  ): Promise<AuthLoginResult> {
    this.ensureConfigured();

    const payload = await this.verifyRefreshToken(refreshToken);

    await this.refreshSessions.assertValidForRefresh(
      refreshToken,
      payload.sid,
      payload.sub,
    );

    const user = await this.findActiveUserById(payload.sub);
    if (!user) {
      throw new RefreshTokenInvalidoException();
    }

    this.permissionsService.invalidateUser(user.id);
    const authorization = await this.permissionsService.resolveAuthorization(
      user.id,
    );

    if (!authorization) {
      throw new RefreshTokenInvalidoException();
    }

    const tokens = await this.issueTokens(user, authorization, context, {
      rotateFromSessionId: payload.sid,
    });

    return {
      ...tokens,
      user: this.buildUserResponse(user, authorization),
    };
  }

  /**
   * Cierra la sesión revocando el refresh token en servidor.
   * Idempotente: siempre responde ok (el cliente debe borrar tokens locales).
   */
  async logout(refreshToken: string): Promise<{ ok: true }> {
    this.ensureConfigured();

    const payload = this.decodeRefreshTokenLoose(refreshToken);
    if (!payload?.sid || !payload.sub) {
      return { ok: true };
    }

    await this.refreshSessions.revokeSession(payload.sid, payload.sub);
    return { ok: true };
  }

  /** Revoca todas las sesiones refresh del usuario (cerrar sesión en todos los dispositivos). */
  async logoutAll(userId: string): Promise<{ ok: true }> {
    this.ensureConfigured();
    await this.refreshSessions.revokeAllForUser(userId);
    return { ok: true };
  }

  /** Usado tras cambio de contraseña o desactivación de cuenta. */
  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.refreshSessions.revokeAllForUser(userId);
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<JwtRefreshPayload> {
    try {
      const verified = await this.jwtService.verifyAsync(
        refreshToken,
        refreshTokenVerifyOptions(this.config.refreshSecret),
      );
      assertRefreshTokenPayload(verified);
      return verified;
    } catch (error) {
      if (error instanceof RefreshTokenInvalidoException) {
        throw error;
      }
      throw new RefreshTokenInvalidoException();
    }
  }

  private decodeRefreshTokenLoose(
    refreshToken: string,
  ): Partial<JwtRefreshPayload> | null {
    const decoded = this.jwtService.decode(refreshToken);
    if (!decoded || typeof decoded === 'string') {
      return null;
    }

    return decoded as Partial<JwtRefreshPayload>;
  }

  private async findUserByCredentials(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const { rows } = await this.db.query<AuthUser>(
      SQL_FIND_USER_BY_EMAIL_AND_PASSWORD,
      [email, password],
    );
    return rows[0] ?? null;
  }

  private async findActiveUserById(id: string): Promise<AuthUser | null> {
    const { rows } = await this.db.query<AuthUser>(SQL_FIND_USER_BY_ID_ACTIVE, [
      id,
    ]);
    return rows[0] ?? null;
  }

  private buildAccessPayload(
    user: AuthUser,
    authorization: NonNullable<
      Awaited<ReturnType<PermissionsService['resolveAuthorization']>>
    >,
  ): JwtAccessPayload {
    return {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: authorization.roles,
      surfaces: authorization.surfaces,
      permissions: authorization.permissions,
      permVersion: authorization.permissionsVersion,
      type: 'access',
    };
  }

  private async issueTokens(
    user: AuthUser,
    authorization: NonNullable<
      Awaited<ReturnType<PermissionsService['resolveAuthorization']>>
    >,
    context: SessionClientContext = {},
    options: { rotateFromSessionId?: string } = {},
  ): Promise<AuthTokens> {
    const accessPayload = this.buildAccessPayload(user, authorization);
    const sessionId = randomUUID();

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      sid: sessionId,
      type: 'refresh',
    };

    const accessExpiresIn = resolveAccessExpiresIn(
      authorization.roles,
      this.config,
    );

    const accessSignOptions = accessTokenSignOptions(
      this.config.accessSecret,
      accessExpiresIn as JwtSignOptions['expiresIn'],
    );

    const refreshSignOptions = refreshTokenSignOptions(
      this.config.refreshSecret,
      this.config.refreshExpiresIn as JwtSignOptions['expiresIn'],
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, accessSignOptions),
      this.jwtService.signAsync(refreshPayload, refreshSignOptions),
    ]);

    await this.refreshSessions.createSession(
      sessionId,
      user.id,
      refreshToken,
      this.config.refreshExpiresIn,
      context,
    );

    if (options.rotateFromSessionId) {
      await this.refreshSessions.revokeSession(
        options.rotateFromSessionId,
        user.id,
        sessionId,
      );
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: parseExpiresInToSeconds(accessExpiresIn),
      tokenType: 'Bearer',
    };
  }

  private buildUserResponse(
    user: AuthUser,
    authorization: NonNullable<
      Awaited<ReturnType<PermissionsService['resolveAuthorization']>>
    >,
  ) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: authorization.roles,
      surfaces: authorization.surfaces,
      permissions: authorization.permissions,
      permVersion: authorization.permissionsVersion,
    };
  }

  private ensureConfigured(): void {
    this.config = loadAuthConfig();
    if (!isAuthConfigured(this.config)) {
      throw new AuthNoConfiguradoException();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
