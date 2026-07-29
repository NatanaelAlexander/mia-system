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
    findAllPriorities: jest.Mock;
    findAllCategories: jest.Mock;
    findAllPaymentStatuses: jest.Mock;
    getTimeline: jest.Mock;
    getAssignees: jest.Mock;
    update: jest.Mock;
    replaceAssignees: jest.Mock;
    changeStatus: jest.Mock;
    moveToDraft: jest.Mock;
    getStatusHistory: jest.Mock;
    getComments: jest.Mock;
    addComment: jest.Mock;
    getTicketAssets: jest.Mock;
    linkAsset: jest.Mock;
    unlinkAsset: jest.Mock;
    uploadAssetToTicket: jest.Mock;
    getCommentAssets: jest.Mock;
    linkAssetToComment: jest.Mock;
    unlinkAssetFromComment: jest.Mock;
    uploadAssetToComment: jest.Mock;
    findAllStatusesForPortal: jest.Mock;
    getTimelineForPortal: jest.Mock;
    findByIdForPortal: jest.Mock;
    createForPortal: jest.Mock;
    getCommentsForPortal: jest.Mock;
    addCommentForPortal: jest.Mock;
    getTicketAssetsForPortal: jest.Mock;
    uploadAssetToTicketForPortal: jest.Mock;
    unlinkAssetForPortal: jest.Mock;
    getCommentAssetsForPortal: jest.Mock;
    uploadAssetToCommentForPortal: jest.Mock;
  };

  beforeAll(async () => {
    ticketsService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: UUID }),
      create: jest.fn().mockResolvedValue({ id: UUID }),
      findAllForPortal: jest.fn().mockResolvedValue([]),
      findAllStatuses: jest.fn().mockResolvedValue([]),
      findAllPriorities: jest.fn().mockResolvedValue([]),
      findAllCategories: jest.fn().mockResolvedValue([]),
      findAllPaymentStatuses: jest.fn().mockResolvedValue([]),
      getTimeline: jest.fn().mockResolvedValue([]),
      getAssignees: jest.fn().mockResolvedValue([{ id: UUID }]),
      update: jest.fn().mockResolvedValue({ id: UUID }),
      replaceAssignees: jest.fn().mockResolvedValue([{ id: UUID }]),
      changeStatus: jest.fn().mockResolvedValue({ id: UUID }),
      moveToDraft: jest.fn().mockResolvedValue({ id: UUID }),
      getStatusHistory: jest.fn().mockResolvedValue([]),
      getComments: jest.fn().mockResolvedValue([]),
      addComment: jest.fn().mockResolvedValue({ id: UUID }),
      getTicketAssets: jest.fn().mockResolvedValue([]),
      linkAsset: jest.fn().mockResolvedValue({ ok: true }),
      unlinkAsset: jest.fn().mockResolvedValue({ ok: true }),
      uploadAssetToTicket: jest.fn().mockResolvedValue({ id: UUID }),
      getCommentAssets: jest.fn().mockResolvedValue([]),
      linkAssetToComment: jest.fn().mockResolvedValue({ ok: true }),
      unlinkAssetFromComment: jest.fn().mockResolvedValue({ ok: true }),
      uploadAssetToComment: jest.fn().mockResolvedValue({ id: UUID }),
      findAllStatusesForPortal: jest.fn().mockResolvedValue([]),
      getTimelineForPortal: jest.fn().mockResolvedValue([]),
      findByIdForPortal: jest.fn().mockResolvedValue({ id: UUID }),
      createForPortal: jest.fn().mockResolvedValue({ id: UUID }),
      getCommentsForPortal: jest.fn().mockResolvedValue([]),
      addCommentForPortal: jest.fn().mockResolvedValue({ id: UUID }),
      getTicketAssetsForPortal: jest.fn().mockResolvedValue([]),
      uploadAssetToTicketForPortal: jest.fn().mockResolvedValue({ id: UUID }),
      unlinkAssetForPortal: jest.fn().mockResolvedValue({ ok: true }),
      getCommentAssetsForPortal: jest.fn().mockResolvedValue([]),
      uploadAssetToCommentForPortal: jest.fn().mockResolvedValue({ id: UUID }),
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

  it('GET /internal/tickets/catalogos/prioridades', async () => {
    await request(app.getHttpServer())
      .get('/internal/tickets/catalogos/prioridades')
      .expect(200);
    expect(ticketsService.findAllPriorities).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('GET /internal/tickets/catalogos/categorias', async () => {
    await request(app.getHttpServer())
      .get('/internal/tickets/catalogos/categorias')
      .expect(200);
    expect(ticketsService.findAllCategories).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('GET /internal/tickets/catalogos/estados-pago', async () => {
    await request(app.getHttpServer())
      .get('/internal/tickets/catalogos/estados-pago')
      .expect(200);
    expect(ticketsService.findAllPaymentStatuses).toHaveBeenCalledWith(
      TEST_USER_ID,
    );
  });

  it('GET /internal/tickets con filtros vacío', async () => {
    ticketsService.findAll.mockResolvedValue([{ id: UUID }]);
    await request(app.getHttpServer())
      .get('/internal/tickets')
      .send({})
      .expect(200);
    expect(ticketsService.findAll).toHaveBeenCalledWith(TEST_USER_ID, {});
  });

  it('POST /internal/tickets/estadisticas/timeline', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/estadisticas/timeline')
      .send({ range: 'month' })
      .expect(201);
    expect(ticketsService.getTimeline).toHaveBeenCalledWith(
      TEST_USER_ID,
      'month',
    );
  });

  it('POST /internal/tickets/asignados/listar', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/asignados/listar')
      .send({ ticketId: UUID })
      .expect(201);

    expect(ticketsService.getAssignees).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('GET /internal/tickets/detalle con id válido', async () => {
    ticketsService.findById.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .get('/internal/tickets/detalle')
      .send({ id: UUID })
      .expect(200);
    expect(ticketsService.findById).toHaveBeenCalledWith(TEST_USER_ID, UUID);
  });

  it('PATCH /internal/tickets/:id actualiza ticket', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/tickets/${UUID}`)
      .send({ title: 'Nuevo título' })
      .expect(200);
    expect(ticketsService.update).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      expect.objectContaining({ title: 'Nuevo título' }),
    );
  });

  it('PATCH /internal/tickets/:id/asignados reemplaza responsables', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/tickets/${UUID}/asignados`)
      .send({ userIds: [UUID] })
      .expect(200);
    expect(ticketsService.replaceAssignees).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      expect.objectContaining({ userIds: [UUID] }),
    );
  });

  it('PATCH /internal/tickets/:id/estado cambia estado', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/tickets/${UUID}/estado`)
      .send({ statusId: UUID })
      .expect(200);
    expect(ticketsService.changeStatus).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      expect.objectContaining({ statusId: UUID }),
    );
  });

  it('DELETE /internal/tickets/:id mueve a borrador', async () => {
    await request(app.getHttpServer())
      .delete(`/internal/tickets/${UUID}`)
      .expect(200);
    // moveToDraft(id, actorUserId)
    expect(ticketsService.moveToDraft).toHaveBeenCalledWith(
      UUID,
      TEST_USER_ID,
    );
  });

  it('GET /internal/tickets/historial-estados', async () => {
    await request(app.getHttpServer())
      .get('/internal/tickets/historial-estados')
      .send({ ticketId: UUID })
      .expect(200);
    expect(ticketsService.getStatusHistory).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('GET /internal/tickets/comentarios', async () => {
    await request(app.getHttpServer())
      .get('/internal/tickets/comentarios')
      .send({ ticketId: UUID })
      .expect(200);
    expect(ticketsService.getComments).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/tickets/comentarios/listar', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/comentarios/listar')
      .send({ ticketId: UUID })
      .expect(201);
    expect(ticketsService.getComments).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/tickets/comentarios agrega comentario', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/comentarios')
      .send({ ticketId: UUID, comment: 'Hola' })
      .expect(201);
    expect(ticketsService.addComment).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ ticketId: UUID, comment: 'Hola' }),
    );
  });

  it('GET /internal/tickets/archivos', async () => {
    await request(app.getHttpServer())
      .get('/internal/tickets/archivos')
      .send({ ticketId: UUID })
      .expect(200);
    expect(ticketsService.getTicketAssets).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/tickets/archivos/listar', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/archivos/listar')
      .send({ ticketId: UUID })
      .expect(201);
    expect(ticketsService.getTicketAssets).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/tickets/vincular-archivo', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/vincular-archivo')
      .send({ ticketId: UUID, assetId: UUID })
      .expect(201);
    expect(ticketsService.linkAsset).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      UUID,
    );
  });

  it('POST /internal/tickets/desvincular-archivo', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/desvincular-archivo')
      .send({ ticketId: UUID, assetId: UUID })
      .expect(201);
    expect(ticketsService.unlinkAsset).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      UUID,
    );
  });

  it('POST /internal/tickets/subir-archivo multipart', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/subir-archivo')
      .field('ticketId', UUID)
      .attach('file', Buffer.from('%PDF-1.4'), 'doc.pdf')
      .expect(201);
    expect(ticketsService.uploadAssetToTicket).toHaveBeenCalled();
  });

  it('GET /internal/tickets/comentarios/archivos', async () => {
    await request(app.getHttpServer())
      .get('/internal/tickets/comentarios/archivos')
      .send({ ticketCommentId: UUID })
      .expect(200);
    expect(ticketsService.getCommentAssets).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/tickets/comentarios/archivos/listar', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/comentarios/archivos/listar')
      .send({ ticketCommentId: UUID })
      .expect(201);
    expect(ticketsService.getCommentAssets).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /internal/tickets/comentarios/vincular-archivo', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/comentarios/vincular-archivo')
      .send({ ticketCommentId: UUID, assetId: UUID })
      .expect(201);
    expect(ticketsService.linkAssetToComment).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      UUID,
    );
  });

  it('POST /internal/tickets/comentarios/desvincular-archivo', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/comentarios/desvincular-archivo')
      .send({ ticketCommentId: UUID, assetId: UUID })
      .expect(201);
    expect(ticketsService.unlinkAssetFromComment).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      UUID,
    );
  });

  it('POST /internal/tickets/comentarios/subir-archivo multipart', async () => {
    await request(app.getHttpServer())
      .post('/internal/tickets/comentarios/subir-archivo')
      .field('ticketCommentId', UUID)
      .attach('file', Buffer.from('%PDF-1.4'), 'doc.pdf')
      .expect(201);
    expect(ticketsService.uploadAssetToComment).toHaveBeenCalled();
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

  it('GET /portal/tickets/catalogos/prioridades', async () => {
    await request(app.getHttpServer())
      .get('/portal/tickets/catalogos/prioridades')
      .expect(200);
    expect(ticketsService.findAllPriorities).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('GET /portal/tickets/catalogos/categorias', async () => {
    await request(app.getHttpServer())
      .get('/portal/tickets/catalogos/categorias')
      .expect(200);
    expect(ticketsService.findAllCategories).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('GET /portal/tickets/catalogos/estados', async () => {
    await request(app.getHttpServer())
      .get('/portal/tickets/catalogos/estados')
      .expect(200);
    expect(ticketsService.findAllStatusesForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
    );
  });

  it('GET /portal/tickets lista tickets cliente', async () => {
    ticketsService.findAllForPortal.mockResolvedValue([{ id: UUID }]);
    await request(app.getHttpServer())
      .get('/portal/tickets')
      .send({})
      .expect(200);
    expect(ticketsService.findAllForPortal).toHaveBeenCalledWith(TEST_USER_ID, {});
  });

  it('POST /portal/tickets/estadisticas/timeline', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets/estadisticas/timeline')
      .send({ range: 'month' })
      .expect(201);
    expect(ticketsService.getTimelineForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      'month',
    );
  });

  it('GET /portal/tickets/detalle con id válido', async () => {
    await request(app.getHttpServer())
      .get('/portal/tickets/detalle')
      .send({ id: UUID })
      .expect(200);
    expect(ticketsService.findByIdForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /portal/tickets/detalle con id válido', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets/detalle')
      .send({ id: UUID })
      .expect(201);
    expect(ticketsService.findByIdForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /portal/tickets crear ticket', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets')
      .send({
        projectId: UUID,
        title: 'Ticket portal',
        priorityId: UUID,
      })
      .expect(201);
    expect(ticketsService.createForPortal).toHaveBeenCalled();
  });

  it('GET /portal/tickets/comentarios', async () => {
    await request(app.getHttpServer())
      .get('/portal/tickets/comentarios')
      .send({ ticketId: UUID })
      .expect(200);
    expect(ticketsService.getCommentsForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /portal/tickets/comentarios/listar', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets/comentarios/listar')
      .send({ ticketId: UUID })
      .expect(201);
    expect(ticketsService.getCommentsForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /portal/tickets/comentarios agrega comentario público', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets/comentarios')
      .send({ ticketId: UUID, comment: 'Gracias' })
      .expect(201);
    expect(ticketsService.addCommentForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      expect.objectContaining({ ticketId: UUID, comment: 'Gracias' }),
    );
  });

  it('POST /portal/tickets/archivos/listar', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets/archivos/listar')
      .send({ ticketId: UUID })
      .expect(201);
    expect(ticketsService.getTicketAssetsForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /portal/tickets/subir-archivo multipart', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets/subir-archivo')
      .field('ticketId', UUID)
      .attach('file', Buffer.from('%PDF-1.4'), 'doc.pdf')
      .expect(201);
    expect(ticketsService.uploadAssetToTicketForPortal).toHaveBeenCalled();
  });

  it('POST /portal/tickets/desvincular-archivo', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets/desvincular-archivo')
      .send({ ticketId: UUID, assetId: UUID })
      .expect(201);
    expect(ticketsService.unlinkAssetForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
      UUID,
    );
  });

  it('POST /portal/tickets/comentarios/archivos/listar', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets/comentarios/archivos/listar')
      .send({ ticketCommentId: UUID })
      .expect(201);
    expect(ticketsService.getCommentAssetsForPortal).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /portal/tickets/comentarios/subir-archivo multipart', async () => {
    await request(app.getHttpServer())
      .post('/portal/tickets/comentarios/subir-archivo')
      .field('ticketCommentId', UUID)
      .attach('file', Buffer.from('%PDF-1.4'), 'doc.pdf')
      .expect(201);
    expect(ticketsService.uploadAssetToCommentForPortal).toHaveBeenCalled();
  });
});
