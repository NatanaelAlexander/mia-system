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
  InternalLegalRepresentativesController,
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
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    findAllForPortal: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
    getCompanyRepresentatives: jest.Mock;
    linkRepresentativeToCompany: jest.Mock;
    unlinkRepresentativeFromCompany: jest.Mock;
    updateCompanyRepresentative: jest.Mock;
    findAllLegalRepresentatives: jest.Mock;
    findLegalRepresentativeById: jest.Mock;
    createLegalRepresentative: jest.Mock;
    updateLegalRepresentative: jest.Mock;
    findByIdForPortal: jest.Mock;
  };
  let usersService: {
    linkCompany: jest.Mock;
    unlinkCompany: jest.Mock;
  };

  beforeAll(async () => {
    usersService = {
      linkCompany: jest.fn(),
      unlinkCompany: jest.fn(),
    };

    companiesService = {
      findAllFiltered: jest.fn().mockResolvedValue([]),
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: UUID, name: 'Demo' }),
      create: jest.fn().mockResolvedValue({ id: UUID, name: 'Demo' }),
      findAllForPortal: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ id: UUID, name: 'Nuevo' }),
      deactivate: jest.fn().mockResolvedValue({ id: UUID, name: 'Nuevo' }),
      getCompanyRepresentatives: jest.fn().mockResolvedValue([]),
      linkRepresentativeToCompany: jest.fn().mockResolvedValue({ id: UUID }),
      unlinkRepresentativeFromCompany: jest.fn().mockResolvedValue(undefined),
      updateCompanyRepresentative: jest.fn().mockResolvedValue({ id: UUID }),
      findAllLegalRepresentatives: jest.fn().mockResolvedValue([]),
      findLegalRepresentativeById: jest.fn().mockResolvedValue({ id: UUID }),
      createLegalRepresentative: jest.fn().mockResolvedValue({ id: UUID }),
      updateLegalRepresentative: jest.fn().mockResolvedValue({ id: UUID }),
      findByIdForPortal: jest.fn().mockResolvedValue({ id: UUID, name: 'Demo' }),
    };

    app = await createApiTestApp({
      controllers: [
        InternalCompaniesController,
        InternalLegalRepresentativesController,
        PortalCompaniesController,
      ],
      providers: [
        { provide: CompaniesService, useValue: companiesService },
        { provide: UsersService, useValue: usersService },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    companiesService.findAllFiltered.mockResolvedValue([]);
    companiesService.findAll.mockResolvedValue([]);
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

  it('GET /internal/companies lista empresas', async () => {
    companiesService.findAll.mockResolvedValue([{ id: UUID }]);
    await request(app.getHttpServer())
      .get('/internal/companies')
      .expect(200);
    expect(companiesService.findAll).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('GET /internal/companies/detalle con id válido', async () => {
    companiesService.findById.mockResolvedValue({ id: UUID, name: 'Demo' });
    await request(app.getHttpServer())
      .get('/internal/companies/detalle')
      .send({ id: UUID })
      .expect(200);
    expect(companiesService.findById).toHaveBeenCalledWith(TEST_USER_ID, UUID);
  });

  it('PATCH /internal/companies/:id actualiza empresa', async () => {
    companiesService.update.mockResolvedValue({ id: UUID, name: 'Nuevo' });
    await request(app.getHttpServer())
      .patch(`/internal/companies/${UUID}`)
      .send({ name: 'Nuevo' })
      .expect(200);
    expect(companiesService.update).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      expect.objectContaining({ name: 'Nuevo' }),
    );
  });

  it('DELETE /internal/companies/:id desactiva empresa', async () => {
    companiesService.deactivate.mockResolvedValue({ id: UUID, name: 'Demo' });
    await request(app.getHttpServer())
      .delete(`/internal/companies/${UUID}`)
      .expect(200);
    expect(companiesService.deactivate).toHaveBeenCalledWith(TEST_USER_ID, UUID);
  });

  it('GET /internal/companies/representantes lista representantes', async () => {
    await request(app.getHttpServer())
      .get('/internal/companies/representantes')
      .send({ companyId: UUID })
      .expect(200);
    expect(companiesService.getCompanyRepresentatives).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/companies/:id/vincular-usuario vincula usuario', async () => {
    usersService.linkCompany.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post(`/internal/companies/${UUID}/vincular-usuario`)
      .send({ userId: UUID })
      .expect(201);
    expect(usersService.linkCompany).toHaveBeenCalledWith(
      UUID,
      { companyId: UUID },
      TEST_USER_ID,
    );
  });

  it('POST /internal/companies/:id/desvincular-usuario desvincula usuario', async () => {
    usersService.unlinkCompany.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post(`/internal/companies/${UUID}/desvincular-usuario`)
      .send({ userId: UUID })
      .expect(201);
    expect(usersService.unlinkCompany).toHaveBeenCalledWith(
      UUID,
      UUID,
      TEST_USER_ID,
    );
  });

  it('POST /internal/companies/:id/representatives vincula representante', async () => {
    companiesService.linkRepresentativeToCompany.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post(`/internal/companies/${UUID}/representatives`)
      .send({ legalRepresentativeId: UUID, position: 'Abogado' })
      .expect(201);
    expect(companiesService.linkRepresentativeToCompany).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      expect.objectContaining({ legalRepresentativeId: UUID }),
    );
  });

  it('DELETE /internal/companies/:id/representatives/:legalRepresentativeId responde 204', async () => {
    companiesService.unlinkRepresentativeFromCompany.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .delete(`/internal/companies/${UUID}/representatives/${UUID}`)
      .expect(204);
    expect(companiesService.unlinkRepresentativeFromCompany).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      UUID,
    );
  });

  it('PATCH /internal/companies/:id/representatives/:legalRepresentativeId actualiza link representante', async () => {
    companiesService.updateCompanyRepresentative.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .patch(`/internal/companies/${UUID}/representatives/${UUID}`)
      .send({ position: 'Senior' })
      .expect(200);
    expect(companiesService.updateCompanyRepresentative).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      UUID,
      expect.objectContaining({ position: 'Senior' }),
    );
  });

  it('GET /internal/legal-representatives lista', async () => {
    await request(app.getHttpServer())
      .get('/internal/legal-representatives')
      .expect(200);
    expect(companiesService.findAllLegalRepresentatives).toHaveBeenCalledWith(
      TEST_USER_ID,
    );
  });

  it('GET /internal/legal-representatives/detalle con id válido', async () => {
    await request(app.getHttpServer())
      .get('/internal/legal-representatives/detalle')
      .send({ id: UUID })
      .expect(200);
    expect(companiesService.findLegalRepresentativeById).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/legal-representatives crea representante', async () => {
    await request(app.getHttpServer())
      .post('/internal/legal-representatives')
      .send({
        firstName: 'Juan',
        lastName: 'Pérez',
        identificationNumber: '12.345.678-5',
        email: 'juan@mia.local',
      })
      .expect(201);
    expect(companiesService.createLegalRepresentative).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ firstName: 'Juan' }),
    );
  });

  it('PATCH /internal/legal-representatives/:id actualiza representante', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/legal-representatives/${UUID}`)
      .send({ firstName: 'Juanito' })
      .expect(200);
    expect(companiesService.updateLegalRepresentative).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      expect.objectContaining({ firstName: 'Juanito' }),
    );
  });

  it('GET /portal/companies/detalle con id válido', async () => {
    await request(app.getHttpServer())
      .get('/portal/companies/detalle')
      .send({ id: UUID })
      .expect(200);
    expect(companiesService.findByIdForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /portal/companies/detalle con id válido', async () => {
    await request(app.getHttpServer())
      .post('/portal/companies/detalle')
      .send({ id: UUID })
      .expect(201);
    expect(companiesService.findByIdForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });
});
