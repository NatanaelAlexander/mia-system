/**
 * Integration: login real contra Postgres + seeds (sin mock de AuthService).
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DatabaseService } from '../../../common/database/database.service';
import {
  SEED_ADMIN,
  countActiveRefreshSessions,
  createAuthIntegrationApp,
} from './auth-integration.helper';

describe('Auth login integration (POST /auth/login)', () => {
  let app: INestApplication<App>;
  let db: DatabaseService;

  beforeAll(async () => {
    ({ app, db } = await createAuthIntegrationApp());
  }, 30_000);

  afterAll(async () => {
    await app?.close();
  });

  it('loguea al admin seed y persiste refresh_session', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: SEED_ADMIN.email,
        password: SEED_ADMIN.password,
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
        tokenType: 'Bearer',
        user: expect.objectContaining({
          id: expect.any(String),
          email: SEED_ADMIN.email,
          roles: expect.any(Array),
          surfaces: expect.any(Array),
          permissions: expect.any(Array),
          permVersion: expect.any(Number),
        }),
      }),
    );

    expect(response.body.accessToken.length).toBeGreaterThan(20);
    expect(response.body.refreshToken.length).toBeGreaterThan(20);
    expect(response.body.user.roles.length).toBeGreaterThan(0);

    const activeSessions = await countActiveRefreshSessions(
      db,
      response.body.user.id,
    );
    expect(activeSessions).toBeGreaterThanOrEqual(1);
  });

  it('rechaza credenciales inválidas con 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: SEED_ADMIN.email,
        password: 'password-incorrecta',
      })
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      mensaje: 'Correo o contraseña incorrectos',
    });
  });
});
