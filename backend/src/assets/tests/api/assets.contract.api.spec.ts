/**
 * Contrato HTTP assets (sin R2) — estilo company-files.
 * Upload real a R2 no se prueba aquí: AssetsService mockeado.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app';
import {
  InternalAssetsController,
  PortalAssetsController,
} from '../../assets.controller';
import { AssetsService } from '../../assets.service';
import { AssetNoEncontradoException } from '../../exceptions/assets.exceptions';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Assets API contract', () => {
  let app: INestApplication<App>;
  let assetsService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    getDownloadUrl: jest.Mock;
    getDownloadUrlForPortal: jest.Mock;
    uploadStandaloneFile: jest.Mock;
    delete: jest.Mock;
  };

  beforeAll(async () => {
    assetsService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: UUID }),
      getDownloadUrl: jest
        .fn()
        .mockResolvedValue({ url: 'https://example.test/f', expiresInSeconds: 300 }),
      getDownloadUrlForPortal: jest
        .fn()
        .mockResolvedValue({ url: 'https://example.test/f', expiresInSeconds: 300 }),
      uploadStandaloneFile: jest.fn().mockResolvedValue({ id: UUID }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    app = await createApiTestApp({
      controllers: [InternalAssetsController, PortalAssetsController],
      providers: [{ provide: AssetsService, useValue: assetsService }],
    });
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('GET /internal/assets lista metadata', async () => {
    assetsService.findAll.mockResolvedValue([]);
    await request(app.getHttpServer()).get('/internal/assets').expect(200);
    expect(assetsService.findAll).toHaveBeenCalled();
  });

  it('POST /internal/assets/descarga con id válido', async () => {
    await request(app.getHttpServer())
      .post('/internal/assets/descarga')
      .send({ id: UUID })
      .expect(201);
    expect(assetsService.getDownloadUrl).toHaveBeenCalledWith(UUID);
  });

  it('POST /internal/assets/descarga rechaza id inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/assets/descarga')
      .send({ id: 'bad' })
      .expect(400);
    expect(assetsService.getDownloadUrl).not.toHaveBeenCalled();
  });

  it('propaga 404 en descarga', async () => {
    assetsService.getDownloadUrl.mockRejectedValue(
      new AssetNoEncontradoException(),
    );
    await request(app.getHttpServer())
      .post('/internal/assets/descarga')
      .send({ id: UUID })
      .expect(404);
  });

  it('POST /internal/assets/subir delega uploadStandaloneFile (sin R2)', async () => {
    assetsService.uploadStandaloneFile.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post('/internal/assets/subir')
      .attach('file', Buffer.from('%PDF-1.4'), 'doc.pdf')
      .expect(201);
    expect(assetsService.uploadStandaloneFile).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
      }),
      TEST_USER_ID,
    );
  });

  it('DELETE /internal/assets/:id responde 204', async () => {
    await request(app.getHttpServer())
      .delete(`/internal/assets/${UUID}`)
      .expect(204);
    expect(assetsService.delete).toHaveBeenCalledWith(UUID);
  });

  it('POST /portal/assets/descarga', async () => {
    await request(app.getHttpServer())
      .post('/portal/assets/descarga')
      .send({ id: UUID })
      .expect(201);
    expect(assetsService.getDownloadUrlForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });
});
