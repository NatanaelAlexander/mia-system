/**
 * Contrato HTTP GET / (sin DB).
 * AppController real + AppService mock.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter';
import { factoryValidacion } from '../../../common/pipes/validation.factory';
import { AppController } from '../../../app.controller';
import { AppService } from '../../../app.service';

describe('App API contract (GET /)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const appService = {
      getHello: jest.fn().mockReturnValue('Hello World!'),
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
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

  it('GET / responde 200 con Hello World!', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toBe('Hello World!');
  });
});

