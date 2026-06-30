import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
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
import { PermissionsService } from './permissions/permissions.service';
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

const LOGIN_FAILURE_DELAY_MS = 400;

@Injectable()
export class AuthService implements OnModuleInit {
  private config: AuthConfig = loadAuthConfig();

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
  ) {}

  onModuleInit(): void {
    this.config = loadAuthConfig();
  }

  async verifyAccessToken(token: string): Promise<JwtAccessPayload> {
    this.ensureConfigured();

    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(
        token,
        { secret: this.config.accessSecret },
      );

      if (payload.type !== 'access') {
        throw new TokenAccesoInvalidoException();
      }

      return payload;
    } catch (error) {
      if (error instanceof TokenAccesoInvalidoException) {
        throw error;
      }
      throw new TokenAccesoInvalidoException();
    }
  }

  async login(email: string, password: string): Promise<AuthLoginResult> {
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

    const tokens = await this.issueTokens(user, authorization);

    return {
      ...tokens,
      user: this.buildUserResponse(user, authorization),
    };
  }

  async refresh(refreshToken: string): Promise<AuthLoginResult> {
    this.ensureConfigured();

    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        refreshToken,
        { secret: this.config.refreshSecret },
      );
    } catch {
      throw new RefreshTokenInvalidoException();
    }

    if (payload.type !== 'refresh') {
      throw new RefreshTokenInvalidoException();
    }

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

    const tokens = await this.issueTokens(user, authorization);

    return {
      ...tokens,
      user: this.buildUserResponse(user, authorization),
    };
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
  ): Promise<AuthTokens> {
    const accessPayload = this.buildAccessPayload(user, authorization);

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      type: 'refresh',
    };

    const accessExpiresIn = resolveAccessExpiresIn(
      authorization.roles,
      this.config,
    );

    const accessSignOptions: JwtSignOptions = {
      secret: this.config.accessSecret,
      expiresIn: accessExpiresIn as JwtSignOptions['expiresIn'],
    };

    const refreshSignOptions: JwtSignOptions = {
      secret: this.config.refreshSecret,
      expiresIn: this.config.refreshExpiresIn as JwtSignOptions['expiresIn'],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, accessSignOptions),
      this.jwtService.signAsync(refreshPayload, refreshSignOptions),
    ]);

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
