/**
 * Integration: rotación de refresh token contra Postgres.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  SEED_ADMIN,
  createAuthIntegrationApp,
} from './auth-integration.helper';

describe('Auth refresh integration (POST /auth/refresh)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    ({ app } = await createAuthIntegrationApp());
  }, 30_000);

  afterAll(async () => {
    await app?.close();
  });

  async function login(): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: SEED_ADMIN.email,
        password: SEED_ADMIN.password,
      })
      .expect(201);

    return {
      accessToken: response.body.accessToken,
      refreshToken: response.body.refreshToken,
    };
  }

  it('rota el refresh y permite renovar con el token nuevo', async () => {
    const { refreshToken: oldRefresh } = await login();

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(201);

    expect(refreshed.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenType: 'Bearer',
        user: expect.objectContaining({
          email: SEED_ADMIN.email,
        }),
      }),
    );

    expect(refreshed.body.refreshToken).not.toBe(oldRefresh);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(201);
  });

  it('ante reuso del refresh viejo responde 401 y revoca la familia', async () => {
    const { refreshToken: oldRefresh } = await login();

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(201);

    const newRefresh = refreshed.body.refreshToken as string;

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(401);

    // Política de seguridad: reuso del refresh anterior invalida también el nuevo.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: newRefresh })
      .expect(401);
  });

  it('rechaza refresh basura con 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'no-es-un-jwt-valido' })
      .expect(401);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 401,
        mensaje: 'Sesión inválida o expirada',
      }),
    );
  });
});
