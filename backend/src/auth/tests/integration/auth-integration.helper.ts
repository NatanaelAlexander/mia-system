/**
 * Bootstrap compartido para integration de auth.
 * Requiere Postgres migrado + migrate:data (seed admin@mia.local).
 * Pensado para correr dentro de Docker: `docker compose exec api pnpm test:auth:integration`
 */
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { App } from 'supertest/types';
import { DatabaseModule } from '../../../common/database/database.module';
import { DatabaseService } from '../../../common/database/database.service';
import { AppExceptionFilter } from '../../../common/filters/app-exception.filter';
import { factoryValidacion } from '../../../common/pipes/validation.factory';
import { AuthModule } from '../../auth.module';

/** Fixture de data-migration (backend/BD/data-migration/users.sql). */
export const SEED_ADMIN = {
  email: 'admin@mia.local',
  password: 'admin',
} as const;

export async function createAuthIntegrationApp(): Promise<{
  app: INestApplication<App>;
  module: TestingModule;
  db: DatabaseService;
}> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      'DATABASE_URL no está definido. Corre los integration tests con Docker (api + bd_main).',
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
      ThrottlerModule.forRoot({
        throttlers: [{ ttl: 60_000, limit: 1_000 }],
      }),
    ],
  })
    // Rate limit ya cubierto en tests/api; aquí no debe interferir el flujo.
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
      `No se pudo conectar a Postgres. ¿bd_main healthy y migrate aplicados? ${String(error)}`,
    );
  }

  const { rowCount } = await db.query(
    `SELECT 1 FROM users WHERE email = $1 AND is_active = TRUE`,
    [SEED_ADMIN.email],
  );

  if (!rowCount) {
    await app.close();
    throw new Error(
      `Usuario seed ${SEED_ADMIN.email} no existe. Corre: pnpm run migrate && pnpm run migrate:data`,
    );
  }

  return { app, module, db };
}

export async function countActiveRefreshSessions(
  db: DatabaseService,
  userId: string,
): Promise<number> {
  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM refresh_sessions
     WHERE user_id = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [userId],
  );

  return Number(rows[0]?.count ?? 0);
}
