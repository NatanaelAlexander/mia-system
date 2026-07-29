/**
 * Contrato HTTP companies (sin DB) — estilo auth/audit.
 * Controller real + CompaniesService mock + ValidationPipe.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app';
import {
  InternalCompaniesController,
  PortalCompaniesController,
} from '../../companies.controller';
import { CompaniesService } from '../../companies.service';
import { UsersService } from '../../../users/users.service';
import { EmpresaNoEncontradaException } from '../../exceptions/companies.exceptions';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Companies API contract', () => {
  let app: INestApplication<App>;
  let companiesService: {
    findAllFiltered: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    findAllForPortal: jest.Mock;
  };

  beforeAll(async () => {
    companiesService = {
      findAllFiltered: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: UUID, name: 'Demo' }),
      create: jest.fn().mockResolvedValue({ id: UUID, name: 'Demo' }),
      findAllForPortal: jest.fn().mockResolvedValue([]),
    };

    app = await createApiTestApp({
      controllers: [InternalCompaniesController, PortalCompaniesController],
      providers: [
        { provide: CompaniesService, useValue: companiesService },
        {
          provide: UsersService,
          useValue: {
            linkCompany: jest.fn(),
            unlinkCompany: jest.fn(),
          },
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    companiesService.findAllFiltered.mockResolvedValue([]);
    companiesService.findById.mockResolvedValue({ id: UUID, name: 'Demo' });
    companiesService.create.mockResolvedValue({ id: UUID, name: 'Demo' });
    companiesService.findAllForPortal.mockResolvedValue([]);
  });

  it('POST /internal/companies/listar delega findAllFiltered', async () => {
    await request(app.getHttpServer())
      .post('/internal/companies/listar')
      .send({})
      .expect(201);

    expect(companiesService.findAllFiltered).toHaveBeenCalledWith(
      TEST_USER_ID,
      {},
    );
  });

  it('POST /internal/companies/detalle rechaza id inválido con 400', async () => {
    await request(app.getHttpServer())
      .post('/internal/companies/detalle')
      .send({ id: 'no-uuid' })
      .expect(400);

    expect(companiesService.findById).not.toHaveBeenCalled();
  });

  it('POST /internal/companies acepta DTO válido', async () => {
    await request(app.getHttpServer())
      .post('/internal/companies')
      .send({ name: 'Empresa Demo', taxId: '12.345.678-5' })
      .expect(201);

    expect(companiesService.create).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ name: 'Empresa Demo', taxId: '12.345.678-5' }),
    );
  });

  it('POST /internal/companies rechaza body incompleto con 400', async () => {
    await request(app.getHttpServer())
      .post('/internal/companies')
      .send({ name: 'Sin RUT' })
      .expect(400);

    expect(companiesService.create).not.toHaveBeenCalled();
  });

  it('propaga 404 de dominio en detalle', async () => {
    companiesService.findById.mockRejectedValue(
      new EmpresaNoEncontradaException(),
    );

    const response = await request(app.getHttpServer())
      .post('/internal/companies/detalle')
      .send({ id: UUID })
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      mensaje: 'Empresa no encontrada',
    });
  });

  it('GET /portal/companies lista para portal', async () => {
    await request(app.getHttpServer()).get('/portal/companies').expect(200);

    expect(companiesService.findAllForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
    );
  });
});
