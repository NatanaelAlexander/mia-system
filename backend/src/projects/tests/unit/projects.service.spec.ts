import { Test } from '@nestjs/testing';
import { AuditService } from '../../../audit/audit.service';
import { PermissionsService } from '../../../auth/permissions/permissions.service';
import { AssetsService } from '../../../assets/assets.service';
import { CompaniesService } from '../../../companies/companies.service';
import { DatabaseService } from '../../../common/database/database.service';
import { PortalAccessService } from '../../../common/portal/portal-access.service';
import { ProyectoNoEncontradoException } from '../../exceptions/projects.exceptions';
import { ProjectsService } from '../../projects.service';

const ACTOR = '550e8400-e29b-41d4-a716-446655440000';
const ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('ProjectsService (unit)', () => {
  let service: ProjectsService;
  let db: { query: jest.Mock };

  beforeEach(async () => {
    db = { query: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: DatabaseService, useValue: db },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: PortalAccessService, useValue: {} },
        { provide: CompaniesService, useValue: { findById: jest.fn() } },
        { provide: AssetsService, useValue: {} },
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
    service = module.get(ProjectsService);
  });

  it('findById lanza si no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(service.findById(ACTOR, ID)).rejects.toBeInstanceOf(
      ProyectoNoEncontradoException,
    );
  });
});
