/**
 * Contrato HTTP de POST /auth/login (sin DB ni prefijo global /api).
 * Monta AuthController + AuthService mock + ValidationPipe de prod.
 */
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter';
import { factoryValidacion } from '../../../common/pipes/validation.factory';
import { AuthController } from '../../auth.controller';
import { AuthService } from '../../auth.service';
import { CredencialesInvalidasException } from '../../exceptions/auth.exceptions';

const LOGIN_RESULT = {
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

describe('Auth login API contract (POST /auth/login)', () => {
  let app: INestApplication<App>;
  let authService: { login: jest.Mock };

  beforeAll(async () => {
    authService = {
      login: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('acepta credenciales válidas y devuelve AuthTokensResponseDto', async () => {
    authService.login.mockResolvedValue(LOGIN_RESULT);

    // Nest POST sin @HttpCode → 201 (OpenAPI documenta 200; el runtime manda 201)
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'cliente@mia.local', password: 'cliente' })
      .expect(201);

    expect(response.body).toEqual(LOGIN_RESULT);
    expect(authService.login).toHaveBeenCalledWith(
      'cliente@mia.local',
      'cliente',
      expect.objectContaining({
        userAgent: null,
        ipAddress: expect.any(String),
      }),
    );
  });

  it('rechaza email inválido con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'no-es-email', password: 'cliente' })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        mensaje: expect.arrayContaining([expect.stringMatching(/correo/i)]),
      }),
    );
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('rechaza password vacío con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'cliente@mia.local', password: '' })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.mensaje).toEqual(
      expect.arrayContaining([expect.stringMatching(/contraseña/i)]),
    );
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('rechaza body incompleto con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'cliente@mia.local' })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('rechaza campos no permitidos con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'cliente@mia.local',
        password: 'cliente',
        extra: 'no-permitido',
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('propaga 401 cuando las credenciales son inválidas', async () => {
    authService.login.mockRejectedValue(new CredencialesInvalidasException());

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'cliente@mia.local', password: 'wrong' })
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      mensaje: 'Correo o contraseña incorrectos',
    });
  });
});
