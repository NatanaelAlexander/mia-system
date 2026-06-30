import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const MIGRATIONS = [
  'users',
  'companies',
  'assets',
  'projects',
  'tickets',
  'audit_logs',
] as const;

const SEPARATOR = '----------------------------------------';
const bdDir = __dirname;
const migrationDir = join(bdDir, 'migration');
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

function loadEnvFile(envPath: string): void {
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, 'utf-8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function resolveDatabaseUrl(): string {
  const inDocker = existsSync('/.dockerenv');
  const user = process.env.POSTGRES_USER ?? 'mia_user';
  const password = process.env.POSTGRES_PASSWORD ?? 'changeme_dev_only';
  const database = process.env.POSTGRES_DB ?? 'mia_system';
  const port = process.env.POSTGRES_PORT ?? '5432';
  const host = inDocker ? 'bd_main' : 'localhost';

  if (process.env.DATABASE_URL) {
    if (inDocker) return process.env.DATABASE_URL;
    return process.env.DATABASE_URL.replace('@bd_main:', `@${host}:`);
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

async function runMigration(
  client: Client,
  sqlFile: string,
  feature: string,
): Promise<boolean> {
  if (!existsSync(sqlFile)) {
    logErr(`No existe el archivo: ${sqlFile}`);
    return false;
  }

  console.log(SEPARATOR);
  logInfo(`Feature: ${feature}`);

  const sql = readFileSync(sqlFile, 'utf-8');

  try {
    await client.query(sql);
    logOk(`Migración aplicada: ${feature}.sql`);
    return true;
  } catch (error) {
    logErr(`Falló la migración: ${feature}.sql`);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return false;
  }
}

async function main(): Promise<void> {
  loadEnvFile(join(rootDir, '.env'));

  const databaseUrl = resolveDatabaseUrl();
  const databaseName = process.env.POSTGRES_DB ?? 'mia_system';

  logInfo(`Base de datos: ${databaseName}`);
  logInfo('Iniciando migraciones...');
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

  for (const feature of MIGRATIONS) {
    const sqlFile = join(migrationDir, `${feature}.sql`);
    const ok = await runMigration(client, sqlFile, feature);

    if (!ok) {
      failed = true;
      break;
    }
  }

  await client.end();

  console.log('');
  console.log(SEPARATOR);

  if (failed) {
    logErr('Migraciones incompletas. Revisa los errores arriba.');
    process.exit(1);
  }

  logOk('Todas las migraciones se aplicaron correctamente.');
}

main().catch((error: unknown) => {
  logErr('Error inesperado al ejecutar migraciones.');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
});
