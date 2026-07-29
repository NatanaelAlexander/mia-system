/**
 * Integration: listar/detalle audit con JWT real + permisos.
 * super_admin bypasea; admin/cliente no tienen audit_logs:read.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuditService } from '../../audit.service';
import { AuditAction } from '../../types/audit.types';
import {
  SEED_ADMIN,
  SEED_CLIENTE,
  SEED_SUPERADMIN,
  createAuditIntegrationApp,
} from './audit-integration.helper';

describe('Audit HTTP integration (internal/audit-logs)', () => {
  let app: INestApplication<App>;
  let auditService: AuditService;

  beforeAll(async () => {
    const boot = await createAuditIntegrationApp();
    app = boot.app;
    auditService = boot.module.get(AuditService);
  }, 30_000);

  afterAll(async () => {
    await app?.close();
  });

  async function login(
    email: string,
    password: string,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.accessToken as string;
  }

  it('superadmin lista audit logs con Bearer', async () => {
    const token = await login(SEED_SUPERADMIN.email, SEED_SUPERADMIN.password);

    const created = await auditService.log({
      action: AuditAction.CREATE,
      tableName: 'companies',
      newValues: { source: 'audit.integration' },
    });

    const response = await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .set('Authorization', `Bearer ${token}`)
      .send({ tableName: 'companies', pageSize: 50 })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        page: 1,
        pageSize: 50,
        items: expect.any(Array),
      }),
    );
    expect(response.body.total).toBeGreaterThanOrEqual(1);
    expect(
      response.body.items.some((item: { id: string }) => item.id === created.id),
    ).toBe(true);
  });

  it('superadmin obtiene detalle por id', async () => {
    const token = await login(SEED_SUPERADMIN.email, SEED_SUPERADMIN.password);
    const created = await auditService.log({
      action: AuditAction.UPDATE,
      tableName: 'projects',
      newValues: { field: 'name' },
    });

    const response = await request(app.getHttpServer())
      .get('/internal/audit-logs/detalle')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: created.id })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: created.id,
        action: AuditAction.UPDATE,
        tableName: 'projects',
      }),
    );
  });

  it('superadmin recibe 404 si el id no existe', async () => {
    const token = await login(SEED_SUPERADMIN.email, SEED_SUPERADMIN.password);

    const response = await request(app.getHttpServer())
      .get('/internal/audit-logs/detalle')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: '11111111-1111-4111-8111-111111111111' })
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      mensaje: 'Registro de auditoría no encontrado',
    });
  });

  it('sin token responde 401', async () => {
    await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .send({})
      .expect(401);
  });

  it('admin sin audit_logs:read responde 403', async () => {
    const token = await login(SEED_ADMIN.email, SEED_ADMIN.password);

    const response = await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(403);

    expect(response.body.statusCode).toBe(403);
  });

  it('cliente (portal) no accede a internal audit', async () => {
    const token = await login(SEED_CLIENTE.email, SEED_CLIENTE.password);

    const response = await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(403);

    expect(response.body.statusCode).toBe(403);
  });
});
