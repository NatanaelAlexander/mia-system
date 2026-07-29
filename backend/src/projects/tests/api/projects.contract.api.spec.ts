import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app';
import {
  InternalProjectsController,
  PortalProjectsController,
} from '../../projects.controller';
import { ProjectsService } from '../../projects.service';
import { ProyectoNoEncontradoException } from '../../exceptions/projects.exceptions';
import { ProjectType } from '../../types/project.types';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Projects API contract', () => {
  let app: INestApplication<App>;
  let projectsService: {
    findAllFiltered: jest.Mock;
    findAllActive: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
    create: jest.Mock;
    getProjectAssets: jest.Mock;
    linkAsset: jest.Mock;
    unlinkAsset: jest.Mock;
    uploadAssetToProject: jest.Mock;
    findAllForPortal: jest.Mock;
    findByIdForPortal: jest.Mock;
  };

  beforeAll(async () => {
    projectsService = {
      findAllFiltered: jest.fn().mockResolvedValue([]),
      findAllActive: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: UUID }),
      update: jest.fn().mockResolvedValue({ id: UUID }),
      deactivate: jest.fn().mockResolvedValue({ id: UUID }),
      create: jest.fn().mockResolvedValue({ id: UUID }),
      getProjectAssets: jest.fn().mockResolvedValue([]),
      linkAsset: jest.fn().mockResolvedValue({ ok: true }),
      unlinkAsset: jest.fn().mockResolvedValue({ ok: true }),
      uploadAssetToProject: jest.fn().mockResolvedValue({ id: UUID }),
      findAllForPortal: jest.fn().mockResolvedValue([]),
      findByIdForPortal: jest.fn().mockResolvedValue({ id: UUID }),
    };
    app = await createApiTestApp({
      controllers: [InternalProjectsController, PortalProjectsController],
      providers: [{ provide: ProjectsService, useValue: projectsService }],
    });
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST /internal/projects/listar', async () => {
    projectsService.findAllFiltered.mockResolvedValue([]);
    await request(app.getHttpServer())
      .post('/internal/projects/listar')
      .send({})
      .expect(201);
    expect(projectsService.findAllFiltered).toHaveBeenCalledWith(
      TEST_USER_ID,
      {},
    );
  });

  it('POST /internal/projects/detalle rechaza id inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/projects/detalle')
      .send({ id: 'x' })
      .expect(400);
  });

  it('POST /internal/projects crea con DTO válido', async () => {
    projectsService.create.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post('/internal/projects')
      .send({
        companyId: UUID,
        name: 'Portal 2026',
        type: ProjectType.EXTERNAL,
      })
      .expect(201);
    expect(projectsService.create).toHaveBeenCalled();
  });

  it('POST /internal/projects rechaza sin companyId', async () => {
    await request(app.getHttpServer())
      .post('/internal/projects')
      .send({ name: 'X', type: ProjectType.EXTERNAL })
      .expect(400);
  });

  it('GET /internal/projects lista activos', async () => {
    projectsService.findAllActive.mockResolvedValue([{ id: UUID }]);

    const res = await request(app.getHttpServer())
      .get('/internal/projects')
      .expect(200);

    expect(res.body).toEqual([{ id: UUID }]);
    expect(projectsService.findAllActive).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('GET /internal/projects/detalle con id válido', async () => {
    projectsService.findById.mockResolvedValue({ id: UUID });

    await request(app.getHttpServer())
      .get('/internal/projects/detalle')
      .send({ id: UUID })
      .expect(200);

    expect(projectsService.findById).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('PATCH /internal/projects/:id actualiza con dto válido', async () => {
    projectsService.update.mockResolvedValue({ id: UUID });

    const res = await request(app.getHttpServer())
      .patch(`/internal/projects/${UUID}`)
      .send({ name: 'Nuevo nombre' })
      .expect(200);

    expect(res.body).toEqual({ id: UUID });
    expect(projectsService.update).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      expect.objectContaining({ name: 'Nuevo nombre' }),
    );
  });

  it('DELETE /internal/projects/:id desactiva proyecto', async () => {
    projectsService.deactivate.mockResolvedValue({ id: UUID });

    const res = await request(app.getHttpServer())
      .delete(`/internal/projects/${UUID}`)
      .expect(200);

    expect(res.body).toEqual({ id: UUID });
    expect(projectsService.deactivate).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('GET /internal/projects/archivos lista assets del proyecto', async () => {
    projectsService.getProjectAssets.mockResolvedValue([{ id: UUID }]);

    await request(app.getHttpServer())
      .get('/internal/projects/archivos')
      .send({ projectId: UUID })
      .expect(200);

    expect(projectsService.getProjectAssets).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/projects/archivos/listar con filtros en body', async () => {
    projectsService.getProjectAssets.mockResolvedValue([{ id: UUID }]);

    await request(app.getHttpServer())
      .post('/internal/projects/archivos/listar')
      .send({ projectId: UUID })
      .expect(201);

    expect(projectsService.getProjectAssets).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/projects/vincular-archivo vincula asset', async () => {
    await request(app.getHttpServer())
      .post('/internal/projects/vincular-archivo')
      .send({ projectId: UUID, assetId: UUID })
      .expect(201);

    expect(projectsService.linkAsset).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      UUID,
    );
  });

  it('POST /internal/projects/desvincular-archivo desvincula asset', async () => {
    await request(app.getHttpServer())
      .post('/internal/projects/desvincular-archivo')
      .send({ projectId: UUID, assetId: UUID })
      .expect(201);

    expect(projectsService.unlinkAsset).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      UUID,
    );
  });

  it('POST /internal/projects/subir-archivo sube multipart y delega uploadAssetToProject', async () => {
    projectsService.uploadAssetToProject.mockResolvedValue({ id: UUID });

    await request(app.getHttpServer())
      .post('/internal/projects/subir-archivo')
      .field('projectId', UUID)
      .attach('file', Buffer.from('%PDF-1.4'), 'doc.pdf')
      .expect(201);

    expect(projectsService.uploadAssetToProject).toHaveBeenCalled();
    const [actorUserId, projectId, file, displayName] =
      projectsService.uploadAssetToProject.mock.calls[0];

    expect(actorUserId).toBe(TEST_USER_ID);
    expect(projectId).toBe(UUID);
    expect(file).toEqual(
      expect.objectContaining({
        originalname: 'doc.pdf',
      }),
    );
    expect(displayName).toBeUndefined();
  });

  it('propaga 404', async () => {
    projectsService.findById.mockRejectedValue(
      new ProyectoNoEncontradoException(),
    );
    const res = await request(app.getHttpServer())
      .post('/internal/projects/detalle')
      .send({ id: UUID })
      .expect(404);
    expect(res.body.statusCode).toBe(404);
  });

  it('GET /portal/projects', async () => {
    projectsService.findAllForPortal.mockResolvedValue([]);
    await request(app.getHttpServer()).get('/portal/projects').expect(200);
    expect(projectsService.findAllForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      {},
    );
  });

  it('POST /portal/projects/listar con body vacío', async () => {
    projectsService.findAllForPortal.mockResolvedValue([]);

    await request(app.getHttpServer())
      .post('/portal/projects/listar')
      .send({})
      .expect(201);

    expect(projectsService.findAllForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      {},
    );
  });

  it('GET /portal/projects/detalle con id válido', async () => {
    projectsService.findByIdForPortal.mockResolvedValue({ id: UUID });

    await request(app.getHttpServer())
      .get('/portal/projects/detalle')
      .send({ id: UUID })
      .expect(200);

    expect(projectsService.findByIdForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /portal/projects/detalle con id válido', async () => {
    projectsService.findByIdForPortal.mockResolvedValue({ id: UUID });

    await request(app.getHttpServer())
      .post('/portal/projects/detalle')
      .send({ id: UUID })
      .expect(201);

    expect(projectsService.findByIdForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });
});
