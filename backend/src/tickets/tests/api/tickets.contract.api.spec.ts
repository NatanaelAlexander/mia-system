import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app';
import {
  InternalTicketsController,
  PortalTicketsController,
} from '../../tickets.controller';
import { TicketsService } from '../../tickets.service';
import { TicketNoEncontradoException } from '../../exceptions/tickets.exceptions';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Tickets API contract', () => {
  let app: INestApplication<App>;
  let ticketsService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    findAllForPortal: jest.Mock;
    findAllStatuses: jest.Mock;
  };

  beforeAll(async () => {
    ticketsService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: UUID }),
      create: jest.fn().mockResolvedValue({ id: UUID }),
      findAllForPortal: jest.fn().mockResolvedValue([]),
      findAllStatuses: jest.fn().mockResolvedValue([]),
    };
    app = await createApiTestApp({
      controllers: [InternalTicketsController, PortalTicketsController],
      providers: [{ provide: TicketsService, useValue: ticketsService }],
    });
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST /internal/tickets/listar', async () => {
    ticketsService.findAll.mockResolvedValue([]);
    await request(app.getHttpServer())
      .post('/internal/tickets/listar')
      .send({})
      .expect(201);
    expect(ticketsService.findAll).toHaveBeenCalledWith(TEST_USER_ID, {});
  });

  it('POST /internal/tickets/detalle rechaza id inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/detalle')
      .send({ id: 'x' })
      .expect(400);
  });

  it('POST /internal/tickets crea con DTO válido', async () => {
    ticketsService.create.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post('/internal/tickets')
      .send({
        projectId: UUID,
        title: 'Error login',
        priorityId: UUID,
      })
      .expect(201);
    expect(ticketsService.create).toHaveBeenCalled();
  });

  it('POST /internal/tickets rechaza sin title', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets')
      .send({ projectId: UUID, priorityId: UUID })
      .expect(400);
  });

  it('propaga 404', async () => {
    ticketsService.findById.mockRejectedValue(new TicketNoEncontradoException());
    await request(app.getHttpServer())
      .post('/internal/tickets/detalle')
      .send({ id: UUID })
      .expect(404);
  });

  it('GET /internal/tickets/catalogos/estados', async () => {
    ticketsService.findAllStatuses.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/internal/tickets/catalogos/estados')
      .expect(200);
    expect(ticketsService.findAllStatuses).toHaveBeenCalled();
  });

  it('POST /portal/tickets/listar', async () => {
    ticketsService.findAllForPortal.mockResolvedValue([]);
    await request(app.getHttpServer())
      .post('/portal/tickets/listar')
      .send({})
      .expect(201);
    expect(ticketsService.findAllForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      {},
    );
  });
});
