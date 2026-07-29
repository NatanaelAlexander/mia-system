import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app';
import {
  InternalNotificationsController,
  PortalNotificationsController,
} from '../../notifications.controller';
import { NotificationsService } from '../../notifications.service';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Notifications API contract', () => {
  let app: INestApplication<App>;
  let notificationsService: {
    listForUser: jest.Mock;
    markAllAsRead: jest.Mock;
    markAsRead: jest.Mock;
    markTicketAsRead: jest.Mock;
    dismissForUser: jest.Mock;
  };

  beforeAll(async () => {
    notificationsService = {
      listForUser: jest.fn().mockResolvedValue({ items: [], unreadCount: 0 }),
      markAllAsRead: jest.fn().mockResolvedValue(undefined),
      markAsRead: jest.fn().mockResolvedValue(undefined),
      markTicketAsRead: jest.fn().mockResolvedValue(undefined),
      dismissForUser: jest.fn().mockResolvedValue(undefined),
    };
    app = await createApiTestApp({
      controllers: [
        InternalNotificationsController,
        PortalNotificationsController,
      ],
      providers: [
        { provide: NotificationsService, useValue: notificationsService },
      ],
    });
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST /internal/notifications/listar', async () => {
    await request(app.getHttpServer())
      .post('/internal/notifications/listar')
      .send({})
      .expect(200);
    expect(notificationsService.listForUser).toHaveBeenCalledWith(
      TEST_USER_ID,
      30,
    );
  });

  it('GET /internal/notifications lista default limit=30', async () => {
    await request(app.getHttpServer())
      .get('/internal/notifications')
      .send({})
      .expect(200);

    expect(notificationsService.listForUser).toHaveBeenCalledWith(
      TEST_USER_ID,
      30,
    );
  });

  it('PATCH /internal/notifications/leer-todas', async () => {
    await request(app.getHttpServer())
      .patch('/internal/notifications/leer-todas')
      .expect(200);
    expect(notificationsService.markAllAsRead).toHaveBeenCalledWith(
      TEST_USER_ID,
    );
  });

  it('PATCH /internal/notifications/:id/leer', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/notifications/${UUID}/leer`)
      .expect(200);
    expect(notificationsService.markAsRead).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('PATCH /internal/notifications/ticket/:ticketId/leer', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/notifications/ticket/${UUID}/leer`)
      .expect(200);

    expect(notificationsService.markTicketAsRead).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('PATCH /internal/notifications/:id/descartar', async () => {
    await request(app.getHttpServer())
      .patch(`/internal/notifications/${UUID}/descartar`)
      .expect(200);

    expect(notificationsService.dismissForUser).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('POST /portal/notifications/listar', async () => {
    await request(app.getHttpServer())
      .post('/portal/notifications/listar')
      .send({ limit: 10 })
      .expect(200);
    expect(notificationsService.listForUser).toHaveBeenCalledWith(
      TEST_USER_ID,
      10,
    );
  });

  it('GET /portal/notifications lista default limit=30', async () => {
    await request(app.getHttpServer())
      .get('/portal/notifications')
      .send({})
      .expect(200);

    expect(notificationsService.listForUser).toHaveBeenCalledWith(
      TEST_USER_ID,
      30,
    );
  });

  it('PATCH /portal/notifications/leer-todas', async () => {
    await request(app.getHttpServer())
      .patch('/portal/notifications/leer-todas')
      .expect(200);

    expect(notificationsService.markAllAsRead).toHaveBeenCalledWith(
      TEST_USER_ID,
    );
  });

  it('PATCH /portal/notifications/ticket/:ticketId/leer', async () => {
    await request(app.getHttpServer())
      .patch(`/portal/notifications/ticket/${UUID}/leer`)
      .expect(200);

    expect(notificationsService.markTicketAsRead).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('PATCH /portal/notifications/:id/leer', async () => {
    await request(app.getHttpServer())
      .patch(`/portal/notifications/${UUID}/leer`)
      .expect(200);

    expect(notificationsService.markAsRead).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });

  it('PATCH /portal/notifications/:id/descartar', async () => {
    await request(app.getHttpServer())
      .patch(`/portal/notifications/${UUID}/descartar`)
      .expect(200);

    expect(notificationsService.dismissForUser).toHaveBeenCalledWith(
      TEST_USER_ID,
      UUID,
    );
  });
});
