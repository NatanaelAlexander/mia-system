/**
 * Contrato HTTP POST /auth/logout-all (sin DB).
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

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('Auth logout-all API contract (POST /auth/logout-all)', () => {
  let app: INestApplication<App>;
  let authService: { logoutAll: jest.Mock };

  beforeAll(async () => {
    authService = { logoutAll: jest.fn() };

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

    // CurrentUser('sub') toma request.user.sub.
    app.use((req: any, _res: any, next: () => void) => {
      req.user = { sub: USER_ID };
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('POST /auth/logout-all revoca sesiones del usuario autenticado (201)', async () => {
    authService.logoutAll.mockResolvedValue({ ok: true });

    const response = await request(app.getHttpServer())
      .post('/auth/logout-all')
      .send({})
      .expect(201);

    expect(response.body).toEqual({ ok: true });
    expect(authService.logoutAll).toHaveBeenCalledWith(USER_ID);
  });
});

