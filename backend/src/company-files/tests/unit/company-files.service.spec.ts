import { Test } from '@nestjs/testing';
import { AssetsService } from '../../../assets/assets.service';
import { DatabaseService } from '../../../common/database/database.service';
import { NombreCarpetaInvalidoException } from '../../exceptions/company-files.exceptions';
import { CompanyFilesService } from '../../company-files.service';

const ACTOR = '550e8400-e29b-41d4-a716-446655440000';
const COMPANY = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('CompanyFilesService (unit)', () => {
  let service: CompanyFilesService;
  let db: { query: jest.Mock };

  beforeEach(async () => {
    db = { query: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        CompanyFilesService,
        { provide: DatabaseService, useValue: db },
        { provide: AssetsService, useValue: {} },
      ],
    }).compile();
    service = module.get(CompanyFilesService);
  });

  it('createFolder rechaza nombre solo espacios', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: COMPANY }], rowCount: 1 });

    await expect(
      service.createFolder(ACTOR, COMPANY, '   '),
    ).rejects.toBeInstanceOf(NombreCarpetaInvalidoException);
  });
});
