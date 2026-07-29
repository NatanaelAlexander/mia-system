/**
 * Integration: AuditService.log / findAll / findById contra Postgres.
 */
import { INestApplication } from '@nestjs/common';
import { AuditService } from '../../audit.service';
import { AuditLogNoEncontradoException } from '../../exceptions/audit.exceptions';
import { AuditAction } from '../../types/audit.types';
import { createAuditIntegrationApp } from './audit-integration.helper';

describe('AuditService integration (Postgres)', () => {
  let app: INestApplication;
  let auditService: AuditService;

  beforeAll(async () => {
    const boot = await createAuditIntegrationApp();
    app = boot.app;
    auditService = boot.module.get(AuditService);
  }, 30_000);

  afterAll(async () => {
    await app?.close();
  });

  it('persiste un log y lo recupera por id y listado filtrado', async () => {
    const marker = `audit-it-${Date.now()}`;

    const created = await auditService.log({
      action: AuditAction.CREATE,
      tableName: 'tickets',
      newValues: { marker },
    });

    expect(created.id).toEqual(expect.any(String));
    expect(created.tableName).toBe('tickets');

    const byId = await auditService.findById(created.id);
    expect(byId.id).toBe(created.id);
    expect(byId.newValues).toEqual(expect.objectContaining({ marker }));

    const listed = await auditService.findAll({
      tableName: 'tickets',
      action: AuditAction.CREATE,
      pageSize: 50,
    });

    expect(listed.items.some((item) => item.id === created.id)).toBe(true);
  });

  it('findById lanza si el uuid no existe', async () => {
    await expect(
      auditService.findById('22222222-2222-4222-8222-222222222222'),
    ).rejects.toBeInstanceOf(AuditLogNoEncontradoException);
  });
});
