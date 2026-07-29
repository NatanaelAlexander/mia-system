/**
 * Integration: logout revoca la sesión refresh en Postgres.
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

describe('Auth logout integration (POST /auth/logout)', () => {
  let app: INestApplication<App>;
  let db: DatabaseService;

  beforeAll(async () => {
    ({ app, db } = await createAuthIntegrationApp());
  }, 30_000);

  afterAll(async () => {
    await app?.close();
  });

  it('revoca el refresh y no permite renovar con ese token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: SEED_ADMIN.email,
        password: SEED_ADMIN.password,
      })
      .expect(201);

    const userId = login.body.user.id as string;
    const refreshToken = login.body.refreshToken as string;
    const sessionsBefore = await countActiveRefreshSessions(db, userId);
    expect(sessionsBefore).toBeGreaterThanOrEqual(1);

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken })
      .expect(201);

    expect(logout.body).toEqual({ ok: true });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('es idempotente con token basura', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'token-basura' })
      .expect(201);

    expect(response.body).toEqual({ ok: true });
  });
});
