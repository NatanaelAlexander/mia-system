/**
 * Company-files: contrato DTO + carpeta (sin R2 real).
 * Upload/validación de archivo: common/utils/upload-validation.util.spec.ts
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app';
import { InternalCompanyFilesController } from '../../company-files.controller';
import { CompanyFilesService } from '../../company-files.service';
import { assertValidUpload } from '../../../common/utils/upload-validation.util';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Company-files API contract', () => {
  let app: INestApplication<App>;
  let companyFilesService: {
    listContents: jest.Mock;
    createFolder: jest.Mock;
    renameFolder: jest.Mock;
    deleteFolderCascade: jest.Mock;
    uploadFile: jest.Mock;
    getDownloadUrl: jest.Mock;
    deleteFile: jest.Mock;
  };

  beforeAll(async () => {
    companyFilesService = {
      listContents: jest.fn().mockResolvedValue({ folders: [], files: [] }),
      createFolder: jest.fn().mockResolvedValue({ id: UUID, name: 'Docs' }),
      renameFolder: jest.fn().mockResolvedValue({ id: UUID, name: 'Docs' }),
      deleteFolderCascade: jest.fn().mockResolvedValue(undefined),
      uploadFile: jest.fn().mockResolvedValue({ id: UUID, fileName: 'doc.pdf' }),
      getDownloadUrl: jest.fn().mockResolvedValue({
        url: 'https://example.test/signed',
        expiresInSeconds: 60,
      }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };
    app = await createApiTestApp({
      controllers: [InternalCompanyFilesController],
      providers: [
        { provide: CompanyFilesService, useValue: companyFilesService },
      ],
    });
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST /contenido lista con companyId válido', async () => {
    companyFilesService.listContents.mockResolvedValue({
      folders: [],
      files: [],
    });
    await request(app.getHttpServer())
      .post('/internal/company-files/contenido')
      .send({ companyId: UUID })
      .expect(201);
    expect(companyFilesService.listContents).toHaveBeenCalledWith(UUID, undefined);
  });

  it('POST /contenido rechaza companyId inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/company-files/contenido')
      .send({ companyId: 'bad' })
      .expect(400);
    expect(companyFilesService.listContents).not.toHaveBeenCalled();
  });

  it('POST /carpetas crea con DTO válido', async () => {
    companyFilesService.createFolder.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post('/internal/company-files/carpetas')
      .send({ companyId: UUID, name: 'Contratos' })
      .expect(201);
    expect(companyFilesService.createFolder).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      'Contratos',
      undefined,
    );
  });

  it('POST /carpetas rechaza nombre vacío', async () => {
    await request(app.getHttpServer())
      .post('/internal/company-files/carpetas')
      .send({ companyId: UUID, name: '' })
      .expect(400);
  });

  it('PATCH /carpetas renombra folder', async () => {
    companyFilesService.renameFolder.mockResolvedValue({ id: UUID, name: 'Nuevo' });

    const response = await request(app.getHttpServer())
      .patch('/internal/company-files/carpetas')
      .send({ folderId: UUID, name: 'Nuevo' })
      .expect(200);

    expect(response.body).toEqual({ id: UUID, name: 'Nuevo' });
    expect(companyFilesService.renameFolder).toHaveBeenCalledWith(UUID, 'Nuevo');
  });

  it('PATCH /carpetas rechaza nombre vacío con 400', async () => {
    await request(app.getHttpServer())
      .patch('/internal/company-files/carpetas')
      .send({ folderId: UUID, name: '' })
      .expect(400);

    expect(companyFilesService.renameFolder).not.toHaveBeenCalled();
  });

  it('POST /carpetas/eliminar elimina carpeta y responde ok (201)', async () => {
    await request(app.getHttpServer())
      .post('/internal/company-files/carpetas/eliminar')
      .send({ folderId: UUID })
      .expect(201);

    expect(companyFilesService.deleteFolderCascade).toHaveBeenCalledWith(UUID);
  });

  it('POST /subir-archivo sube multipart y delega uploadFile (201)', async () => {
    await request(app.getHttpServer())
      .post('/internal/company-files/subir-archivo')
      .field('companyId', UUID)
      .attach('file', Buffer.from('%PDF-1.4'), 'doc.pdf')
      .expect(201);

    expect(companyFilesService.uploadFile).toHaveBeenCalled();
    const [actorUserId, companyId, file, folderId, displayName] =
      companyFilesService.uploadFile.mock.calls[0];

    expect(actorUserId).toBe(TEST_USER_ID);
    expect(companyId).toBe(UUID);
    expect(file).toEqual(
      expect.objectContaining({
        originalname: 'doc.pdf',
      }),
    );
    // Como no mandamos displayName, debe ir undefined.
    expect(displayName).toBeUndefined();
    // folderId es optional y no lo enviamos.
    expect(folderId).toBeUndefined();
  });

  it('POST /archivos/descarga devuelve url firmada (201)', async () => {
    await request(app.getHttpServer())
      .post('/internal/company-files/archivos/descarga')
      .send({ assetId: UUID })
      .expect(201);

    expect(companyFilesService.getDownloadUrl).toHaveBeenCalledWith(UUID);
  });

  it('POST /archivos/eliminar elimina archivo y responde ok (201)', async () => {
    await request(app.getHttpServer())
      .post('/internal/company-files/archivos/eliminar')
      .send({ assetId: UUID })
      .expect(201);

    expect(companyFilesService.deleteFile).toHaveBeenCalledWith(UUID);
  });
});

describe('Company-files upload policy (unit, sin R2)', () => {
  it('rechaza extensiones peligrosas (misma regla que subir-archivo)', () => {
    expect(() =>
      assertValidUpload({
        originalName: 'malware.exe',
        mimeType: 'application/octet-stream',
        size: 10,
      }),
    ).toThrow('TIPO_ARCHIVO_NO_PERMITIDO');
  });

  it('acepta PDF permitido', () => {
    expect(() =>
      assertValidUpload({
        originalName: 'contrato.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      }),
    ).not.toThrow();
  });
});
