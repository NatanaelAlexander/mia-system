import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../../common/database/database.service';
import { AuditService } from '../../audit.service';
import { AuditLogNoEncontradoException } from '../../exceptions/audit.exceptions';
import { AuditAction } from '../../types/audit.types';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const RECORD_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';
const LOG_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

const SAMPLE_LOG = {
  id: LOG_ID,
  userId: USER_ID,
  action: AuditAction.CREATE,
  tableName: 'companies',
  recordId: RECORD_ID,
  oldValues: null,
  newValues: { name: 'Demo' },
  createdAt: new Date('2026-07-01T12:00:00.000Z'),
};

describe('AuditService (unit)', () => {
  let service: AuditService;
  let db: { query: jest.Mock };

  beforeEach(async () => {
    db = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  describe('log', () => {
    it('inserta y devuelve el registro creado', async () => {
      db.query.mockResolvedValue({ rows: [SAMPLE_LOG] });

      const result = await service.log({
        userId: USER_ID,
        action: AuditAction.CREATE,
        tableName: 'companies',
        recordId: RECORD_ID,
        newValues: { name: 'Demo' },
      });

      expect(result).toEqual(SAMPLE_LOG);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [
          USER_ID,
          AuditAction.CREATE,
          'companies',
          RECORD_ID,
          null,
          { name: 'Demo' },
        ],
      );
    });

    it('normaliza undefined a null en campos opcionales', async () => {
      db.query.mockResolvedValue({
        rows: [{ ...SAMPLE_LOG, userId: null, recordId: null }],
      });

      await service.log({
        action: AuditAction.READ,
        tableName: 'tickets',
      });

      expect(db.query).toHaveBeenCalledWith(expect.any(String), [
        null,
        AuditAction.READ,
        'tickets',
        null,
        null,
        null,
      ]);
    });
  });

  describe('findById', () => {
    it('devuelve el registro si existe', async () => {
      db.query.mockResolvedValue({ rows: [SAMPLE_LOG] });

      await expect(service.findById(LOG_ID)).resolves.toEqual(SAMPLE_LOG);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [LOG_ID],
      );
    });

    it('lanza AuditLogNoEncontradoException si no existe', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(service.findById(LOG_ID)).rejects.toBeInstanceOf(
        AuditLogNoEncontradoException,
      );
    });
  });

  describe('findAll', () => {
    it('usa page=1 y pageSize=20 por defecto', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.findAll();

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });

      const dataCall = db.query.mock.calls[1];
      expect(dataCall[0]).toContain('ORDER BY created_at DESC');
      expect(dataCall[1]).toEqual([20, 0]);
    });

    it('clampa page y pageSize', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [SAMPLE_LOG] });

      const result = await service.findAll({ page: 0, pageSize: 999 });

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(200);
      expect(db.query.mock.calls[1][1]).toEqual([200, 0]);
    });

    it('aplica filtros y offset de paginación', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: 25 }] })
        .mockResolvedValueOnce({ rows: [SAMPLE_LOG] });

      const result = await service.findAll({
        tableName: 'companies',
        action: AuditAction.CREATE,
        userId: USER_ID,
        recordId: RECORD_ID,
        dateFrom: '2026-07-01T00:00:00.000Z',
        dateTo: '2026-07-31T23:59:59.999Z',
        page: 2,
        pageSize: 10,
      });

      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);

      const [countSql, countParams] = db.query.mock.calls[0];
      expect(countSql).toContain('WHERE');
      expect(countSql).toContain('table_name = $1');
      expect(countSql).toContain('record_id = $2');
      expect(countSql).toContain('user_id = $3');
      expect(countSql).toContain('action = $4');
      expect(countSql).toContain('created_at >= $5');
      expect(countSql).toContain('created_at <= $6');
      expect(countParams).toEqual([
        'companies',
        RECORD_ID,
        USER_ID,
        AuditAction.CREATE,
        '2026-07-01T00:00:00.000Z',
        '2026-07-31T23:59:59.999Z',
      ]);

      const [, dataParams] = db.query.mock.calls[1];
      expect(dataParams).toEqual([...countParams, 10, 10]);
    });
  });
});
