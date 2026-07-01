import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { resolveDatabaseUrl } from '../src/common/database/database-url';

const DATA_MIGRATIONS = [
  'permissions',
  'roles',
  'job_titles',
  'job_titles_permissions',
  'job_titles_spanish_labels',
  'tickets',
  'users',
  'companies',
] as const;

const SEPARATOR = '----------------------------------------';
const bdDir = __dirname;
const dataMigrationDir = join(bdDir, 'data-migration');
const rootDir = join(bdDir, '../..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function logOk(message: string): void {
  console.log(`${colors.green}[OK]${colors.reset} ${message}`);
}

function logErr(message: string): void {
  console.error(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function logInfo(message: string): void {
  console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`);
}

async function runDataMigration(
  client: Client,
  sqlFile: string,
  feature: string,
): Promise<boolean> {
  if (!existsSync(sqlFile)) {
    logErr(`No existe el archivo: ${sqlFile}`);
    return false;
  }

  console.log(SEPARATOR);
  logInfo(`Data feature: ${feature}`);

  const sql = readFileSync(sqlFile, 'utf-8');

  try {
    await client.query(sql);
    logOk(`Data aplicada: ${feature}.sql`);
    return true;
  } catch (error) {
    logErr(`Falló data migration: ${feature}.sql`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return false;
  }
}

async function main(): Promise<void> {
  let databaseUrl: string;

  try {
    databaseUrl = resolveDatabaseUrl(rootDir);
  } catch (error) {
    logErr(error instanceof Error ? error.message : 'DATABASE_URL inválida');
    process.exit(1);
  }

  const databaseName = process.env.POSTGRES_DB ?? 'mia_system';

  logInfo(`Base de datos: ${databaseName}`);
  logInfo('Iniciando data migrations...');
  console.log('');

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
  } catch (error) {
    logErr('No se pudo conectar a PostgreSQL.');
    logInfo('Levanta Postgres con: docker compose up bd_main -d');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  let failed = false;

  for (const feature of DATA_MIGRATIONS) {
    const sqlFile = join(dataMigrationDir, `${feature}.sql`);
    const ok = await runDataMigration(client, sqlFile, feature);

    if (!ok) {
      failed = true;
      break;
    }
  }

  await client.end();

  console.log('');
  console.log(SEPARATOR);

  if (failed) {
    logErr('Data migrations incompletas. Revisa los errores arriba.');
    process.exit(1);
  }

  logOk('Todas las data migrations se aplicaron correctamente.');
}

main().catch((error: unknown) => {
  logErr('Error inesperado al ejecutar data migrations.');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
});
