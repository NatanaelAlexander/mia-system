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
    findAllRoles: jest.Mock;
    findAllJobTitles: jest.Mock;
    findAllJobTitlesWithUsage: jest.Mock;
    createJobTitle: jest.Mock;
    updateJobTitle: jest.Mock;
    deleteJobTitle: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
    assignRoles: jest.Mock;
    linkCompany: jest.Mock;
    unlinkCompany: jest.Mock;
    updateProfile: jest.Mock;
  };

  beforeAll(async () => {
    usersService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: UUID, email: 'a@mia.local' }),
      create: jest.fn().mockResolvedValue({ id: UUID }),
      changeOwnPassword: jest.fn().mockResolvedValue(undefined),
      findAllRoles: jest.fn().mockResolvedValue([{ id: UUID, name: 'admin' }]),
      findAllJobTitles: jest.fn().mockResolvedValue([{ id: UUID, name: 'Dev' }]),
      findAllJobTitlesWithUsage: jest.fn().mockResolvedValue([{ id: UUID, name: 'Dev', userCount: 1 }]),
      createJobTitle: jest.fn().mockResolvedValue({ id: UUID }),
      updateJobTitle: jest.fn().mockResolvedValue({ id: UUID }),
      deleteJobTitle: jest.fn().mockResolvedValue({ id: UUID }),
      update: jest.fn().mockResolvedValue({ id: UUID }),
      deactivate: jest.fn().mockResolvedValue({ id: UUID }),
      assignRoles: jest.fn().mockResolvedValue({ id: UUID }),
      linkCompany: jest.fn().mockResolvedValue({ id: UUID }),
      unlinkCompany: jest.fn().mockResolvedValue({ id: UUID }),
      updateProfile: jest.fn().mockResolvedValue({ id: UUID }),
    };

    app = await createApiTestApp({
      controllers: [
        InternalUserProfileController,
        InternalUsersController,
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

  it('GET /internal/users lista usuarios', async () => {
    usersService.findAll.mockResolvedValue([{ id: UUID }]);
    await request(app.getHttpServer())
      .get('/internal/users')
      .send({})
      .expect(200);
    expect(usersService.findAll).toHaveBeenCalledWith({});
  });

  it('GET /internal/users/detalle con id válido', async () => {
    usersService.findById.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .get('/internal/users/detalle')
      .send({ id: UUID })
      .expect(200);
    expect(usersService.findById).toHaveBeenCalledWith(UUID);
  });

  it('GET /internal/users/catalogos/roles', async () => {
    await request(app.getHttpServer())
      .get('/internal/users/catalogos/roles')
      .expect(200);
    expect(usersService.findAllRoles).toHaveBeenCalled();
  });

  it('GET /internal/users/catalogos/cargos', async () => {
    await request(app.getHttpServer())
      .get('/internal/users/catalogos/cargos')
      .expect(200);
    expect(usersService.findAllJobTitles).toHaveBeenCalled();
  });

  it('POST /internal/users/catalogos/cargos/listar', async () => {
    await request(app.getHttpServer())
      .post('/internal/users/catalogos/cargos/listar')
      .send({})
      .expect(201);
    expect(usersService.findAllJobTitlesWithUsage).toHaveBeenCalled();
  });

  it('GET /internal/users/catalogos/cargos/admin', async () => {
    await request(app.getHttpServer())
      .get('/internal/users/catalogos/cargos/admin')
      .expect(200);
    expect(usersService.findAllJobTitlesWithUsage).toHaveBeenCalled();
  });

  it('POST /internal/users/catalogos/cargos crea cargo', async () => {
    await request(app.getHttpServer())
      .post('/internal/users/catalogos/cargos')
      .send({ name: 'Backend Dev' })
      .expect(201);
    expect(usersService.createJobTitle).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Backend Dev' }),
      TEST_USER_ID,
    );
  });

  it('PATCH /internal/users/catalogos/cargos/:id actualiza cargo', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/users/catalogos/cargos/${UUID}`)
      .send({ name: 'Frontend Dev' })
      .expect(200);
    expect(usersService.updateJobTitle).toHaveBeenCalledWith(
      UUID,
      expect.objectContaining({ name: 'Frontend Dev' }),
      TEST_USER_ID,
    );
  });

  it('DELETE /internal/users/catalogos/cargos/:id elimina cargo', async () => {
    await request(app.getHttpServer())
      .delete(`/internal/users/catalogos/cargos/${UUID}`)
      .expect(200);
    expect(usersService.deleteJobTitle).toHaveBeenCalledWith(UUID, TEST_USER_ID);
  });

  it('PATCH /internal/users/:id actualiza usuario (admin)', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/users/${UUID}`)
      .send({ firstName: 'Nuevo' })
      .expect(200);
    expect(usersService.update).toHaveBeenCalledWith(
      UUID,
      expect.objectContaining({ firstName: 'Nuevo' }),
      TEST_USER_ID,
      { asAdmin: true },
    );
  });

  it('DELETE /internal/users/:id desactiva usuario', async () => {
    await request(app.getHttpServer())
      .delete(`/internal/users/${UUID}`)
      .expect(200);
    expect(usersService.deactivate).toHaveBeenCalledWith(UUID, TEST_USER_ID);
  });

  it('PATCH /internal/users/:id/roles asigna roles', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/users/${UUID}/roles`)
      .send({ roleIds: [UUID] })
      .expect(200);
    expect(usersService.assignRoles).toHaveBeenCalledWith(
      UUID,
      expect.objectContaining({ roleIds: [UUID] }),
      TEST_USER_ID,
    );
  });

  it('POST /internal/users/vincular-empresa vincula usuario', async () => {
    await request(app.getHttpServer())
      .post('/internal/users/vincular-empresa')
      .send({ userId: UUID, companyId: UUID })
      .expect(201);
    expect(usersService.linkCompany).toHaveBeenCalledWith(
      UUID,
      expect.objectContaining({ userId: UUID, companyId: UUID }),
      TEST_USER_ID,
    );
  });

  it('POST /internal/users/desvincular-empresa desvincula usuario', async () => {
    await request(app.getHttpServer())
      .post('/internal/users/desvincular-empresa')
      .send({ userId: UUID, companyId: UUID })
      .expect(201);
    expect(usersService.unlinkCompany).toHaveBeenCalledWith(
      UUID,
      UUID,
      TEST_USER_ID,
    );
  });

  it('GET /internal/users/perfil ver mi perfil', async () => {
    usersService.findById.mockResolvedValue({ id: TEST_USER_ID });
    await request(app.getHttpServer())
      .get('/internal/users/perfil')
      .expect(200);
    expect(usersService.findById).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('PATCH /internal/users/perfil actualiza mi perfil', async () => {
    await request(app.getHttpServer())
      .patch('/internal/users/perfil')
      .send({ firstName: 'MiNombre' })
      .expect(200);
    expect(usersService.updateProfile).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ firstName: 'MiNombre' }),
    );
  });

  it('PATCH /portal/users/perfil actualiza mi perfil (portal)', async () => {
    await request(app.getHttpServer())
      .patch('/portal/users/perfil')
      .send({ lastName: 'MiApellido' })
      .expect(200);
    expect(usersService.updateProfile).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ lastName: 'MiApellido' }),
    );
  });

  it('PATCH /portal/users/perfil/contrasena cambia contraseña (portal)', async () => {
    await request(app.getHttpServer())
      .patch('/portal/users/perfil/contrasena')
      .send({ currentPassword: 'x', newPassword: 'NuevaClave123' })
      .expect(200);
    expect(usersService.changeOwnPassword).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ currentPassword: 'x' }),
    );
  });
});
