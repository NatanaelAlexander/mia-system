/**
 * Unit AssetsService — dominio con DB/R2 mock (sin R2 real).
 */
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../../common/database/database.service';
import { PortalAccessService } from '../../../common/portal/portal-access.service';
import { R2StorageService } from '../../../common/storage/r2-storage.service';
import {
  ArchivoRequeridoException,
  AssetNoEncontradoException,
  R2NoConfiguradoException,
  TipoArchivoNoPermitidoException,
} from '../../exceptions/assets.exceptions';
import { AssetsService } from '../../assets.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssetsService (unit)', () => {
  let service: AssetsService;
  let db: { query: jest.Mock };
  let r2: {
    isConfigured: jest.Mock;
    upload: jest.Mock;
    getSignedDownloadUrl: jest.Mock;
    deleteByKey: jest.Mock;
  };

  beforeEach(async () => {
    db = { query: jest.fn() };
    r2 = {
      isConfigured: jest.fn().mockReturnValue(true),
      upload: jest.fn(),
      getSignedDownloadUrl: jest.fn(),
      deleteByKey: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: DatabaseService, useValue: db },
        { provide: R2StorageService, useValue: r2 },
        {
          provide: PortalAccessService,
          useValue: { assertAsset: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AssetsService);
  });

  it('findById lanza si el asset no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(service.findById(ID)).rejects.toBeInstanceOf(
      AssetNoEncontradoException,
    );
  });

  it('uploadFile rechaza buffer vacío', async () => {
    await expect(
      service.uploadFile({
        buffer: Buffer.alloc(0),
        originalName: 'doc.pdf',
        mimeType: 'application/pdf',
        ownerType: 'assets',
        ownerId: ID,
      }),
    ).rejects.toBeInstanceOf(ArchivoRequeridoException);
    expect(r2.upload).not.toHaveBeenCalled();
  });

  it('uploadFile rechaza extensión no permitida', async () => {
    await expect(
      service.uploadFile({
        buffer: Buffer.from('x'),
        originalName: 'malware.exe',
        mimeType: 'application/octet-stream',
        ownerType: 'assets',
        ownerId: ID,
      }),
    ).rejects.toBeInstanceOf(TipoArchivoNoPermitidoException);
    expect(r2.upload).not.toHaveBeenCalled();
  });

  it('getDownloadUrl lanza si R2 no está configurado', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: ID, filePath: 'assets/x/doc.pdf' }],
    });
    r2.isConfigured.mockReturnValue(false);

    await expect(service.getDownloadUrl(ID)).rejects.toBeInstanceOf(
      R2NoConfiguradoException,
    );
    expect(r2.getSignedDownloadUrl).not.toHaveBeenCalled();
  });
});
