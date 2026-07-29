/**
 * Contrato HTTP users (sin DB) — estilo companies/auth.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app';
import {
  InternalUserProfileController,
  InternalUsersController,
  PortalUserProfileController,
} from '../../users.controller';
import { UsersService } from '../../users.service';
import { UsuarioNoEncontradoException } from '../../exceptions/users.exceptions';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Users API contract', () => {
  let app: INestApplication<App>;
  let usersService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    changeOwnPassword: jest.Mock;
  };

  beforeAll(async () => {
    usersService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: UUID, email: 'a@mia.local' }),
      create: jest.fn().mockResolvedValue({ id: UUID }),
      changeOwnPassword: jest.fn().mockResolvedValue(undefined),
    };

    app = await createApiTestApp({
      controllers: [
        InternalUsersController,
        InternalUserProfileController,
        PortalUserProfileController,
      ],
      providers: [{ provide: UsersService, useValue: usersService }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('POST /internal/users/listar delega findAll', async () => {
    usersService.findAll.mockResolvedValue([]);
    await request(app.getHttpServer())
      .post('/internal/users/listar')
      .send({})
      .expect(201);
    expect(usersService.findAll).toHaveBeenCalled();
  });

  it('POST /internal/users/detalle rechaza id inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/users/detalle')
      .send({ id: 'bad' })
      .expect(400);
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('POST /internal/users crea con DTO válido', async () => {
    usersService.create.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post('/internal/users')
      .send({
        email: 'nuevo@mia.local',
        password: 'Temporal123',
        firstName: 'María',
        lastName: 'González',
      })
      .expect(201);
    expect(usersService.create).toHaveBeenCalled();
  });

  it('POST /internal/users rechaza email inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/users')
      .send({
        email: 'no-email',
        password: 'Temporal123',
        firstName: 'María',
        lastName: 'González',
      })
      .expect(400);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('propaga 404 en detalle', async () => {
    usersService.findById.mockRejectedValue(new UsuarioNoEncontradoException());
    const res = await request(app.getHttpServer())
      .post('/internal/users/detalle')
      .send({ id: UUID })
      .expect(404);
    expect(res.body.mensaje).toMatch(/usuario/i);
  });

  it('PATCH /internal/users/perfil/contrasena valida body', async () => {
    await request(app.getHttpServer())
      .patch('/internal/users/perfil/contrasena')
      .send({ currentPassword: 'x', newPassword: '12' })
      .expect(400);
  });

  it('GET /portal/users/perfil lee perfil', async () => {
    usersService.findById.mockResolvedValue({ id: TEST_USER_ID });
    await request(app.getHttpServer()).get('/portal/users/perfil').expect(200);
    expect(usersService.findById).toHaveBeenCalledWith(TEST_USER_ID);
  });
});
