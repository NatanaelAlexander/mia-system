import { Test } from '@nestjs/testing';
import { AuditService } from '../../../audit/audit.service';
import { AuthService } from '../../../auth/auth.service';
import { PermissionsService } from '../../../auth/permissions/permissions.service';
import { DatabaseService } from '../../../common/database/database.service';
import {
  ContrasenaActualIncorrectaException,
  EmailUsuarioDuplicadoException,
  UsuarioNoEncontradoException,
} from '../../exceptions/users.exceptions';
import { UsersService } from '../../users.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('UsersService (unit)', () => {
  let service: UsersService;
  let db: { query: jest.Mock };

  beforeEach(async () => {
    db = { query: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: db },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: PermissionsService,
          useValue: { invalidateUser: jest.fn() },
        },
        {
          provide: AuthService,
          useValue: { revokeAllSessionsForUser: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('findById lanza si no existe', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(service.findById(ID)).rejects.toBeInstanceOf(
      UsuarioNoEncontradoException,
    );
  });

  it('create lanza si el email ya existe', async () => {
    db.query.mockResolvedValue({ rowCount: 1, rows: [{}] });
    await expect(
      service.create(
        {
          email: 'admin@mia.local',
          password: 'Temporal123',
          firstName: 'A',
          lastName: 'B',
        },
        ID,
      ),
    ).rejects.toBeInstanceOf(EmailUsuarioDuplicadoException);
  });

  it('changeOwnPassword lanza si la actual no coincide', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(
      service.changeOwnPassword(ID, {
        currentPassword: 'mala',
        newPassword: 'NuevaClave123',
      }),
    ).rejects.toBeInstanceOf(ContrasenaActualIncorrectaException);
  });
});
