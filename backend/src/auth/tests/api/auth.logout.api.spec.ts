/**
 * Contrato HTTP POST /auth/logout (sin DB).
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

describe('Auth logout API contract (POST /auth/logout)', () => {
  let app: INestApplication<App>;
  let authService: { logout: jest.Mock };

  beforeAll(async () => {
    authService = { logout: jest.fn() };

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

  it('acepta refresh válido y responde ok (201)', async () => {
    authService.logout.mockResolvedValue({ ok: true });

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'refresh-token-example' })
      .expect(201);

    expect(authService.logout).toHaveBeenCalledWith('refresh-token-example');
  });

  it('rechaza refresh vacío con 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: '' })
      .expect(400);

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('es idempotente con token basura (pasa validación) y responde ok', async () => {
    authService.logout.mockResolvedValue({ ok: true });

    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'token-basura' })
      .expect(201);

    expect(response.body).toEqual({ ok: true });
    expect(authService.logout).toHaveBeenCalledWith('token-basura');
  });
});

