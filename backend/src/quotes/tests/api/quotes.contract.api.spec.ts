import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app';
import {
  InternalQuotesController,
  PublicQuotesController,
} from '../../quotes.controller';
import { QuotesService } from '../../quotes.service';
import { CotizacionNoEncontradaException } from '../../exceptions/quotes.exceptions';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Quotes API contract', () => {
  let app: INestApplication<App>;
  let quotesService: {
    findAllFiltered: jest.Mock;
    findById: jest.Mock;
    findByPublicAccess: jest.Mock;
    listIssuers: jest.Mock;
    listStatusCatalog: jest.Mock;
    listPresets: jest.Mock;
    createPreset: jest.Mock;
    updatePreset: jest.Mock;
    deletePreset: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    send: jest.Mock;
    toggleShare: jest.Mock;
    setStatuses: jest.Mock;
    uploadSignedDocument: jest.Mock;
    removeSignedDocument: jest.Mock;
  };

  beforeAll(async () => {
    quotesService = {
      findAllFiltered: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      findById: jest.fn().mockResolvedValue({ id: UUID }),
      findByPublicAccess: jest.fn().mockResolvedValue({ id: UUID }),
      listIssuers: jest.fn().mockResolvedValue([]),
      listStatusCatalog: jest.fn().mockResolvedValue([]),
      listPresets: jest.fn().mockResolvedValue([]),
      createPreset: jest.fn().mockResolvedValue({ id: UUID }),
      updatePreset: jest.fn().mockResolvedValue({ id: UUID }),
      deletePreset: jest.fn().mockResolvedValue({ ok: true }),
      update: jest.fn().mockResolvedValue({ id: UUID }),
      remove: jest.fn().mockResolvedValue({ id: UUID }),
      send: jest.fn().mockResolvedValue({ ok: true }),
      toggleShare: jest.fn().mockResolvedValue({ ok: true }),
      setStatuses: jest.fn().mockResolvedValue({ ok: true }),
      uploadSignedDocument: jest.fn().mockResolvedValue({ ok: true }),
      removeSignedDocument: jest.fn().mockResolvedValue({ ok: true }),
    };
    app = await createApiTestApp({
      controllers: [InternalQuotesController, PublicQuotesController],
      providers: [{ provide: QuotesService, useValue: quotesService }],
    });
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST /internal/quotes/listar', async () => {
    quotesService.findAllFiltered.mockResolvedValue({ items: [] });
    await request(app.getHttpServer())
      .post('/internal/quotes/listar')
      .send({})
      .expect(201);
    expect(quotesService.findAllFiltered).toHaveBeenCalledWith(
      TEST_USER_ID,
      {},
    );
  });

  it('POST /internal/quotes/detalle rechaza id inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/quotes/detalle')
      .send({ id: 'x' })
      .expect(400);
  });

  it('POST /internal/quotes rechaza body incompleto', async () => {
    await request(app.getHttpServer())
      .post('/internal/quotes')
      .send({ companyId: UUID })
      .expect(400);
  });

  it('propaga 404 en detalle', async () => {
    quotesService.findById.mockRejectedValue(
      new CotizacionNoEncontradaException(),
    );
    await request(app.getHttpServer())
      .post('/internal/quotes/detalle')
      .send({ id: UUID })
      .expect(404);
  });

  it('POST /public/quotes/:id con token', async () => {
    quotesService.findByPublicAccess.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post(`/public/quotes/${UUID}`)
      .send({ token: 'a'.repeat(32) })
      .expect(201);
    expect(quotesService.findByPublicAccess).toHaveBeenCalledWith(
      UUID,
      'a'.repeat(32),
    );
  });

  it('GET /internal/quotes/emisores', async () => {
    quotesService.listIssuers.mockResolvedValue([{ id: UUID }]);
    await request(app.getHttpServer())
      .get('/internal/quotes/emisores')
      .expect(200);
    expect(quotesService.listIssuers).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('GET /internal/quotes/estados', async () => {
    quotesService.listStatusCatalog.mockResolvedValue([{ code: 'ready' }]);
    await request(app.getHttpServer())
      .get('/internal/quotes/estados')
      .expect(200);
    expect(quotesService.listStatusCatalog).toHaveBeenCalledWith(
      TEST_USER_ID,
    );
  });

  it('POST /internal/quotes/presets/listar', async () => {
    quotesService.listPresets.mockResolvedValue([{ id: UUID }]);
    await request(app.getHttpServer())
      .post('/internal/quotes/presets/listar')
      .send({})
      .expect(201);
    expect(quotesService.listPresets).toHaveBeenCalledWith(TEST_USER_ID, undefined);
  });

  it('POST /internal/quotes/presets crea preset', async () => {
    quotesService.createPreset.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post('/internal/quotes/presets')
      .send({ name: 'Preset A', payload: { x: 1 } })
      .expect(201);
    expect(quotesService.createPreset).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ name: 'Preset A' }),
    );
  });

  it('PATCH /internal/quotes/presets/:id actualiza preset', async () => {
    quotesService.updatePreset.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .patch(`/internal/quotes/presets/${UUID}`)
      .send({ name: 'Preset B' })
      .expect(200);
    expect(quotesService.updatePreset).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      expect.objectContaining({ name: 'Preset B' }),
    );
  });

  it('DELETE /internal/quotes/presets/:id elimina preset', async () => {
    quotesService.deletePreset.mockResolvedValue({ ok: true });
    await request(app.getHttpServer())
      .delete(`/internal/quotes/presets/${UUID}`)
      .expect(200);
    expect(quotesService.deletePreset).toHaveBeenCalledWith(TEST_USER_ID, UUID);
  });

  it('PATCH /internal/quotes/:id actualiza cotización', async () => {
    quotesService.update.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .patch(`/internal/quotes/${UUID}`)
      .send({ clientVisible: true })
      .expect(200);
    expect(quotesService.update).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      expect.objectContaining({ clientVisible: true }),
    );
  });

  it('DELETE /internal/quotes/:id elimina cotización', async () => {
    quotesService.remove.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .delete(`/internal/quotes/${UUID}`)
      .expect(200);
    expect(quotesService.remove).toHaveBeenCalledWith(TEST_USER_ID, UUID);
  });

  it('POST /internal/quotes/:id/enviar', async () => {
    quotesService.send.mockResolvedValue({ ok: true });
    await request(app.getHttpServer())
      .post(`/internal/quotes/${UUID}/enviar`)
      .expect(201);
    expect(quotesService.send).toHaveBeenCalledWith(TEST_USER_ID, UUID);
  });

  it('POST /internal/quotes/:id/enlace', async () => {
    quotesService.toggleShare.mockResolvedValue({ ok: true });
    await request(app.getHttpServer())
      .post(`/internal/quotes/${UUID}/enlace`)
      .send({ enabled: true })
      .expect(201);
    expect(quotesService.toggleShare).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      true,
    );
  });

  it('POST /internal/quotes/:id/estados', async () => {
    quotesService.setStatuses.mockResolvedValue({ ok: true });
    await request(app.getHttpServer())
      .post(`/internal/quotes/${UUID}/estados`)
      .send({ statusCode: 'pagado' })
      .expect(201);
    expect(quotesService.setStatuses).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      'pagado',
    );
  });

  it('POST /internal/quotes/:id/documento-firmado sube multipart', async () => {
    quotesService.uploadSignedDocument.mockResolvedValue({ ok: true });
    await request(app.getHttpServer())
      .post(`/internal/quotes/${UUID}/documento-firmado`)
      .attach('file', Buffer.from('%PDF-1.4'), 'firmado.pdf')
      .expect(201);

    expect(quotesService.uploadSignedDocument).toHaveBeenCalled();
    const [actorUserId, quoteId, file] =
      quotesService.uploadSignedDocument.mock.calls[0];
    expect(actorUserId).toBe(TEST_USER_ID);
    expect(quoteId).toBe(UUID);
    expect(file).toEqual(
      expect.objectContaining({
        originalname: 'firmado.pdf',
      }),
    );
  });

  it('DELETE /internal/quotes/:id/documento-firmado elimina documento', async () => {
    quotesService.removeSignedDocument.mockResolvedValue({ ok: true });
    await request(app.getHttpServer())
      .delete(`/internal/quotes/${UUID}/documento-firmado`)
      .expect(200);
    expect(quotesService.removeSignedDocument).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });
});
