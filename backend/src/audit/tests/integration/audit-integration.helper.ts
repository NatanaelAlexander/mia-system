/**
 * Bootstrap integration de audit: AuthModule + AuditModule + guard real + Postgres.
 */
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { App } from 'supertest/types';
import { AuditModule } from '../../../audit/audit.module';
import { AuthModule } from '../../../auth/auth.module';
import { ApiAuthorizationGuard } from '../../../auth/guards/api-authorization.guard';
import { DatabaseModule } from '../../../common/database/database.module';
import { DatabaseService } from '../../../common/database/database.service';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter';
import { factoryValidacion } from '../../../common/pipes/validation.factory';

export const SEED_SUPERADMIN = {
  email: 'superadmin@mia.local',
  password: 'superadmin',
} as const;

export const SEED_ADMIN = {
  email: 'admin@mia.local',
  password: 'admin',
} as const;

export const SEED_CLIENTE = {
  email: 'cliente@mia.local',
  password: 'cliente',
} as const;

export async function createAuditIntegrationApp(): Promise<{
  app: INestApplication<App>;
  module: TestingModule;
  db: DatabaseService;
}> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      'DATABASE_URL no está definido. Corre integration con Docker (api + bd_main).',
    );
  }

  if (
    !process.env.JWT_ACCESS_SECRET?.trim() ||
    !process.env.JWT_REFRESH_SECRET?.trim()
  ) {
    throw new Error(
      'JWT_ACCESS_SECRET / JWT_REFRESH_SECRET no están definidos.',
    );
  }

  const module = await Test.createTestingModule({
    imports: [
      DatabaseModule,
      AuthModule,
      AuditModule,
      ThrottlerModule.forRoot({
        throttlers: [{ ttl: 60_000, limit: 1_000 }],
      }),
    ],
    providers: [
      {
        provide: APP_GUARD,
        useClass: ApiAuthorizationGuard,
      },
    ],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = module.createNestApplication();
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

  const db = module.get(DatabaseService);

  try {
    await db.query('SELECT 1');
  } catch (error) {
    await app.close();
    throw new Error(
      `No se pudo conectar a Postgres. ¿migrate aplicados? ${String(error)}`,
    );
  }

  for (const email of [
    SEED_SUPERADMIN.email,
    SEED_ADMIN.email,
    SEED_CLIENTE.email,
  ]) {
    const { rowCount } = await db.query(
      `SELECT 1 FROM users WHERE email = $1 AND is_active = TRUE`,
      [email],
    );
    if (!rowCount) {
      await app.close();
      throw new Error(
        `Usuario seed ${email} no existe. Corre: pnpm run migrate && pnpm run migrate:data`,
      );
    }
  }

  return { app, module, db };
}
