/**
 * Contrato HTTP POST /auth/refresh (sin DB).
 * AuthController real + AuthService mock + ValidationPipe.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter';
import { factoryValidacion } from '../../../common/pipes/validation.factory';
import { AuthController } from '../../auth.controller';
import { AuthService } from '../../auth.service';
import { RefreshTokenInvalidoException } from '../../exceptions/auth.exceptions';

const REFRESH_RESULT = {
  accessToken: 'access-token-example',
  refreshToken: 'refresh-token-example',
  expiresIn: 900,
  tokenType: 'Bearer' as const,
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'cliente@mia.local',
    firstName: 'Cliente',
    lastName: 'Demo',
    roles: ['cliente'],
    surfaces: ['portal'],
    permissions: ['tickets:read'],
    permVersion: 1,
  },
};

describe('Auth refresh API contract (POST /auth/refresh)', () => {
  let app: INestApplication<App>;
  let authService: { refresh: jest.Mock };

  beforeAll(async () => {
    authService = { refresh: jest.fn() };

    const moduleFixture = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AppExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: factoryValidacion,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('acepta refresh válido y devuelve AuthTokensResponseDto (201)', async () => {
    authService.refresh.mockResolvedValue(REFRESH_RESULT);

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'refresh-token-example' })
      .expect(201);

    expect(response.body).toEqual(REFRESH_RESULT);
    expect(authService.refresh).toHaveBeenCalledWith(
      'refresh-token-example',
      expect.objectContaining({
        userAgent: null,
        ipAddress: expect.any(String),
      }),
    );
  });

  it('rechaza refresh vacío con 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: '' })
      .expect(400);

    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('rechaza refresh no-string con 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 123 })
      .expect(400);

    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('propaga 401 cuando el refresh token es inválido', async () => {
    authService.refresh.mockRejectedValue(new RefreshTokenInvalidoException());

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'token-basura' })
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      mensaje: 'Sesión inválida o expirada',
    });
  });
});

