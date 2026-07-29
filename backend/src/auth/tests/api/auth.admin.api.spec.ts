/**
 * Contrato HTTP AuthAdmin (sin DB).
 * AuthAdminController real + AuthAdminService mock.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter';
import { factoryValidacion } from '../../../common/pipes/validation.factory';
import { AuthAdminController } from '../../auth-admin.controller';
import { AuthAdminService } from '../../auth-admin.service';

describe('Auth-admin API contract', () => {
  let app: INestApplication<App>;
  let authAdminService: {
    listPermissions: jest.Mock;
    verifyAuthorizationHealth: jest.Mock;
  };

  beforeAll(async () => {
    authAdminService = {
      listPermissions: jest.fn().mockResolvedValue([
        { id: '1', name: 'tickets:read', module: 'tickets' },
      ]),
      verifyAuthorizationHealth: jest.fn().mockResolvedValue({
        roles: 3,
        permissions: 38,
        usersWithoutRoles: 0,
        usersWithoutPermissions: 0,
        adminRolePermissionCount: 30,
        superAdminRolePermissionCount: 37,
        healthy: true,
        warnings: [],
      }),
    };

    const moduleFixture = await Test.createTestingModule({
      controllers: [AuthAdminController],
      providers: [{ provide: AuthAdminService, useValue: authAdminService }],
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

  beforeEach(() => jest.clearAllMocks());

  it('GET /internal/admin/authorization/permissions', async () => {
    await request(app.getHttpServer())
      .get('/internal/admin/authorization/permissions')
      .expect(200);

    expect(authAdminService.listPermissions).toHaveBeenCalled();
  });

  it('GET /internal/admin/authorization/verify', async () => {
    // Evita dependencias de orden: solo validamos forma de respuesta.
    await request(app.getHttpServer())
      .get('/internal/admin/authorization/verify')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            healthy: true,
            warnings: [],
          }),
        );
      });

    expect(authAdminService.verifyAuthorizationHealth).toHaveBeenCalled();
  });
});

