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
    findById: jest.Mock;
    create: jest.Mock;
    findAllForPortal: jest.Mock;
  };

  beforeAll(async () => {
    projectsService = {
      findAllFiltered: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: UUID }),
      create: jest.fn().mockResolvedValue({ id: UUID }),
      findAllForPortal: jest.fn().mockResolvedValue([]),
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
});
