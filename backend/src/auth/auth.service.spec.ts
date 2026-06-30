import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../common/database/database.service';
import { AuthService } from './auth.service';
import {
  TokenAccesoInvalidoException,
  RefreshTokenInvalidoException,
} from './exceptions/auth.exceptions';
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
} from './jwt-token.util';
import { PermissionsService } from './permissions/permissions.service';

const ACCESS_SECRET = 'test-access-secret-32-chars-minimum!!';
const REFRESH_SECRET = 'test-refresh-secret-32-chars-minimum!';

describe('AuthService JWT verification', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: DatabaseService,
          useValue: { query: jest.fn() },
        },
        {
          provide: PermissionsService,
          useValue: {
            invalidateUser: jest.fn(),
            resolveAuthorization: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
    authService.onModuleInit();
  });

  it('rechaza un Bearer arbitrario que no es JWT', async () => {
    await expect(authService.verifyAccessToken('cualquier-cosa')).rejects.toBeInstanceOf(
      TokenAccesoInvalidoException,
    );
  });

  it('rechaza un JWT firmado con otro secreto', async () => {
    const foreignToken = await jwtService.signAsync(
      { sub: '550e8400-e29b-41d4-a716-446655440000', type: 'access', permVersion: 1 },
      accessTokenSignOptions('otro-secreto-completamente-distinto', '1h'),
    );

    await expect(authService.verifyAccessToken(foreignToken)).rejects.toBeInstanceOf(
      TokenAccesoInvalidoException,
    );
  });

  it('rechaza un refresh token usado como access token', async () => {
    const refreshAsAccess = await jwtService.signAsync(
      { sub: '550e8400-e29b-41d4-a716-446655440000', type: 'refresh' },
      refreshTokenSignOptions(REFRESH_SECRET, '1h'),
    );

    await expect(authService.verifyAccessToken(refreshAsAccess)).rejects.toBeInstanceOf(
      TokenAccesoInvalidoException,
    );
  });

  it('acepta un access token válido firmado con el secreto configurado', async () => {
    const token = await jwtService.signAsync(
      {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['admin'],
        surfaces: ['internal'],
        permissions: ['tickets:read'],
        permVersion: 1,
        type: 'access',
      },
      accessTokenSignOptions(ACCESS_SECRET, '1h'),
    );

    const payload = await authService.verifyAccessToken(token);

    expect(payload.sub).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(payload.type).toBe('access');
  });

  it('rechaza refresh token con sub inválido', async () => {
    const badRefresh = await jwtService.signAsync(
      { sub: 'no-es-uuid', type: 'refresh' },
      refreshTokenSignOptions(REFRESH_SECRET, '1h'),
    );

    await expect(authService.refresh(badRefresh)).rejects.toBeInstanceOf(
      RefreshTokenInvalidoException,
    );
  });
});
