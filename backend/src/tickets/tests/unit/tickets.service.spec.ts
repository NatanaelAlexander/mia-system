import { Test } from '@nestjs/testing';
import { AuditService } from '../../../audit/audit.service';
import { PermissionsService } from '../../../auth/permissions/permissions.service';
import { AssetsService } from '../../../assets/assets.service';
import { DatabaseService } from '../../../common/database/database.service';
import { PortalAccessService } from '../../../common/portal/portal-access.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { ProjectsService } from '../../../projects/projects.service';
import { TicketNoEncontradoException } from '../../exceptions/tickets.exceptions';
import { TicketsRealtimeService } from '../../realtime/tickets-realtime.service';
import { TicketsService } from '../../tickets.service';

const ACTOR = '550e8400-e29b-41d4-a716-446655440000';
const ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('TicketsService (unit)', () => {
  let service: TicketsService;
  let db: { query: jest.Mock };

  beforeEach(async () => {
    db = { query: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: DatabaseService, useValue: db },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: PortalAccessService, useValue: {} },
        { provide: ProjectsService, useValue: {} },
        { provide: AssetsService, useValue: {} },
        { provide: TicketsRealtimeService, useValue: {} },
        {
          provide: PermissionsService,
          useValue: {
            resolveAuthorization: jest.fn().mockResolvedValue({
              roles: ['super_admin'],
            }),
            isSuperAdmin: jest.fn().mockReturnValue(true),
          },
        },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();
    service = module.get(TicketsService);
  });

  it('findById lanza si el ticket no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(service.findById(ACTOR, ID)).rejects.toBeInstanceOf(
      TicketNoEncontradoException,
    );
  });
});
