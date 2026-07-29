/**
 * Rate limit real de POST /auth/login (sin mock de ThrottlerGuard).
 * Contrato: @Throttle limit 5 / 60s → 429 con forma de AppExceptionFilter.
 */
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter';
import { factoryValidacion } from '../../../common/pipes/validation.factory';
import { AuthController } from '../../auth.controller';
import { AuthService } from '../../auth.service';

const LOGIN_BODY = {
  email: 'cliente@mia.local',
  password: 'cliente',
};

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

describe('Auth login API rate limit (POST /auth/login)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60_000, limit: 5 }],
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(LOGIN_RESULT),
          },
        },
      ],
    }).compile();

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

  it('permite 5 intentos y responde 429 en el sexto', async () => {
    const server = app.getHttpServer();

    for (let attempt = 1; attempt <= 5; attempt++) {
      await request(server).post('/auth/login').send(LOGIN_BODY).expect(201);
    }

    const response = await request(server)
      .post('/auth/login')
      .send(LOGIN_BODY)
      .expect(429);

    expect(response.body).toEqual({
      statusCode: 429,
      mensaje: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
    });
  });
});
