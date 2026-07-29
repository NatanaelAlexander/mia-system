/**
 * App mínima para tests/api (estilo auth/audit).
 * Inyecta request.user para @CurrentUser sin montar ApiAuthorizationGuard.
 */
import {
  INestApplication,
  Type,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppExceptionFilter } from '../filters/app-exception.filter';
import { factoryValidacion } from '../pipes/validation.factory';

export const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function createApiTestApp(options: {
  controllers: Type<unknown>[];
  providers: { provide: unknown; useValue: unknown }[];
}): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    controllers: options.controllers,
    providers: options.providers,
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: factoryValidacion,
    }),
  );
  app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
    req.user = {
      sub: TEST_USER_ID,
      email: 'test@mia.local',
      firstName: 'Test',
      lastName: 'User',
      roles: ['admin'],
      surfaces: ['internal', 'portal'],
      permissions: [],
      permVersion: 1,
      type: 'access',
    };
    next();
  });
  await app.init();
  return app;
}
