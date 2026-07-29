import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../../common/database/database.service';
import { NotificationsRealtimeService } from '../../realtime/notifications-realtime.service';
import { NotificationsService } from '../../notifications.service';

const USER = '550e8400-e29b-41d4-a716-446655440000';

describe('NotificationsService (unit)', () => {
  let service: NotificationsService;
  let db: { query: jest.Mock };
  let realtime: { emitUnreadCount: jest.Mock };

  beforeEach(async () => {
    db = { query: jest.fn() };
    realtime = { emitUnreadCount: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: DatabaseService, useValue: db },
        { provide: NotificationsRealtimeService, useValue: realtime },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  it('listForUser clampa el limit y arma respuesta', async () => {
    db.query.mockResolvedValue({ rows: [{ id: '1', count: 2 }] });

    const result = await service.listForUser(USER, 999);

    expect(result.items).toEqual([{ id: '1', count: 2 }]);
    expect(result.unreadCount).toBe(2);
    expect(db.query.mock.calls[0][1]).toEqual([USER, 100]);
  });
});
