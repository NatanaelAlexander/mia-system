/**
 * Unit CompaniesService — casos de dominio con mocks (estilo auth/audit).
 */
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../../common/database/database.service';
import { AuditService } from '../../../audit/audit.service';
import { PortalAccessService } from '../../../common/portal/portal-access.service';
import { PermissionsService } from '../../../auth/permissions/permissions.service';
import { CompaniesService } from '../../companies.service';
import {
  EmpresaNoEncontradaException,
  RutEmpresaDuplicadoException,
  RutInvalidoException,
} from '../../exceptions/companies.exceptions';

const ACTOR = '550e8400-e29b-41d4-a716-446655440000';
const COMPANY_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('CompaniesService (unit)', () => {
  let service: CompaniesService;
  let db: { query: jest.Mock };

  beforeEach(async () => {
    db = { query: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: DatabaseService, useValue: db },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: PortalAccessService,
          useValue: { userHasCompany: jest.fn(), assertCompany: jest.fn() },
        },
        {
          provide: PermissionsService,
          useValue: {
            resolveAuthorization: jest.fn().mockResolvedValue({
              roles: ['super_admin'],
            }),
            isSuperAdmin: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get(CompaniesService);
  });

  it('findById lanza si la empresa no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await expect(service.findById(ACTOR, COMPANY_ID)).rejects.toBeInstanceOf(
      EmpresaNoEncontradaException,
    );
  });

  it('create rechaza RUT inválido sin tocar BD', async () => {
    await expect(
      service.create(ACTOR, { name: 'Demo', taxId: '12.345.678-0' }),
    ).rejects.toBeInstanceOf(RutInvalidoException);
  });

  it('create rechaza RUT duplicado', async () => {
    db.query.mockResolvedValue({ rowCount: 1, rows: [{ id: COMPANY_ID }] });

    await expect(
      service.create(ACTOR, { name: 'Demo', taxId: '12.345.678-5' }),
    ).rejects.toBeInstanceOf(RutEmpresaDuplicadoException);
  });
});
