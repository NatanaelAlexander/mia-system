import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  TEST_USER_ID,
  createApiTestApp,
} from '../../../common/testing/create-api-test-app';
import {
  InternalQuotesController,
  PublicQuotesController,
} from '../../quotes.controller';
import { QuotesService } from '../../quotes.service';
import { CotizacionNoEncontradaException } from '../../exceptions/quotes.exceptions';

const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Quotes API contract', () => {
  let app: INestApplication<App>;
  let quotesService: {
    findAllFiltered: jest.Mock;
    findById: jest.Mock;
    findByPublicAccess: jest.Mock;
    listIssuers: jest.Mock;
  };

  beforeAll(async () => {
    quotesService = {
      findAllFiltered: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      findById: jest.fn().mockResolvedValue({ id: UUID }),
      findByPublicAccess: jest.fn().mockResolvedValue({ id: UUID }),
      listIssuers: jest.fn().mockResolvedValue([]),
    };
    app = await createApiTestApp({
      controllers: [InternalQuotesController, PublicQuotesController],
      providers: [{ provide: QuotesService, useValue: quotesService }],
    });
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST /internal/quotes/listar', async () => {
    quotesService.findAllFiltered.mockResolvedValue({ items: [] });
    await request(app.getHttpServer())
      .post('/internal/quotes/listar')
      .send({})
      .expect(201);
    expect(quotesService.findAllFiltered).toHaveBeenCalledWith(
      TEST_USER_ID,
      {},
    );
  });

  it('POST /internal/quotes/detalle rechaza id inválido', async () => {
    await request(app.getHttpServer())
      .post('/internal/quotes/detalle')
      .send({ id: 'x' })
      .expect(400);
  });

  it('POST /internal/quotes rechaza body incompleto', async () => {
    await request(app.getHttpServer())
      .post('/internal/quotes')
      .send({ companyId: UUID })
      .expect(400);
  });

  it('propaga 404 en detalle', async () => {
    quotesService.findById.mockRejectedValue(
      new CotizacionNoEncontradaException(),
    );
    await request(app.getHttpServer())
      .post('/internal/quotes/detalle')
      .send({ id: UUID })
      .expect(404);
  });

  it('POST /public/quotes/:id con token', async () => {
    quotesService.findByPublicAccess.mockResolvedValue({ id: UUID });
    await request(app.getHttpServer())
      .post(`/public/quotes/${UUID}`)
      .send({ token: 'a'.repeat(32) })
      .expect(201);
    expect(quotesService.findByPublicAccess).toHaveBeenCalledWith(
      UUID,
      'a'.repeat(32),
    );
  });
});
