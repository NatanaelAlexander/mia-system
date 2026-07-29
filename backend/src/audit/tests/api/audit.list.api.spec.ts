/**
 * Contrato HTTP de internal/audit-logs (sin DB).
 * Controller real + AuditService mock + ValidationPipe de prod.
 */
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter';
import { factoryValidacion } from '../../../common/pipes/validation.factory';
import { InternalAuditController } from '../../audit.controller';
import { AuditService } from '../../audit.service';
import { AuditLogNoEncontradoException } from '../../exceptions/audit.exceptions';

const LOG_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const PAGINATED = {
  items: [
    {
      id: LOG_ID,
      userId: USER_ID,
      action: 'create',
      tableName: 'companies',
      recordId: null,
      oldValues: null,
      newValues: { name: 'Demo' },
      createdAt: '2026-07-01T12:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

describe('Audit API contract (internal/audit-logs)', () => {
  let app: INestApplication<App>;
  let auditService: {
    findAll: jest.Mock;
    findById: jest.Mock;
  };

  beforeAll(async () => {
    auditService = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [InternalAuditController],
      providers: [
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AppExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: factoryValidacion,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET / responde 200 y delega findAll vacío', async () => {
    auditService.findAll.mockResolvedValue(PAGINATED);

    const response = await request(app.getHttpServer())
      .get('/internal/audit-logs')
      .send({})
      .expect(200);

    expect(response.body).toEqual(PAGINATED);
    expect(auditService.findAll).toHaveBeenCalledWith({});
  });

  it('POST /listar sin body delega findAll vacío y responde 200', async () => {
    auditService.findAll.mockResolvedValue(PAGINATED);

    const response = await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .send({})
      .expect(200);

    expect(response.body).toEqual(PAGINATED);
    expect(auditService.findAll).toHaveBeenCalledWith({});
  });

  it('POST /listar reenvía filtros válidos', async () => {
    auditService.findAll.mockResolvedValue(PAGINATED);

    const filters = {
      tableName: 'companies',
      action: 'create',
      userId: USER_ID,
      page: 2,
      pageSize: 10,
    };

    await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .send(filters)
      .expect(200);

    expect(auditService.findAll).toHaveBeenCalledWith(
      expect.objectContaining(filters),
    );
  });

  it('rechaza userId inválido con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .send({ userId: 'no-uuid' })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(auditService.findAll).not.toHaveBeenCalled();
  });

  it('rechaza pageSize > 200 con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .send({ pageSize: 201 })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(auditService.findAll).not.toHaveBeenCalled();
  });

  it('rechaza dateFrom inválida con 400', async () => {
    await request(app.getHttpServer())
      .post('/internal/audit-logs/listar')
      .send({ dateFrom: 'ayer' })
      .expect(400);

    expect(auditService.findAll).not.toHaveBeenCalled();
  });

  it('GET /detalle con id válido llama findById', async () => {
    auditService.findById.mockResolvedValue(PAGINATED.items[0]);

    const response = await request(app.getHttpServer())
      .get('/internal/audit-logs/detalle')
      .send({ id: LOG_ID })
      .expect(200);

    expect(response.body).toEqual(PAGINATED.items[0]);
    expect(auditService.findById).toHaveBeenCalledWith(LOG_ID);
  });

  it('GET /detalle sin id responde 400', async () => {
    await request(app.getHttpServer())
      .get('/internal/audit-logs/detalle')
      .send({})
      .expect(400);

    expect(auditService.findById).not.toHaveBeenCalled();
  });

  it('propaga 404 cuando el registro no existe', async () => {
    auditService.findById.mockRejectedValue(new AuditLogNoEncontradoException());

    const response = await request(app.getHttpServer())
      .get('/internal/audit-logs/detalle')
      .send({ id: LOG_ID })
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      mensaje: 'Registro de auditoría no encontrado',
    });
  });
});
