import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadEnvFile(envPath: string): void {
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

function loadEnvFromCandidates(paths: string[]): void {
  for (const envPath of paths) {
    loadEnvFile(envPath);
    if (process.env.DATABASE_URL) return;
  }
}

export function resolveDatabaseUrl(rootDir?: string): string {
  if (!process.env.DATABASE_URL) {
    const candidates = rootDir
      ? [join(rootDir, '.env')]
      : [join(process.cwd(), '.env'), join(process.cwd(), '../.env')];

    loadEnvFromCandidates(candidates);
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL no está definida. Copia .env.example a .env en la raíz del repo.',
    );
  }

  const inDocker = existsSync('/.dockerenv');

  if (!inDocker && databaseUrl.includes('@bd_main:')) {
    return databaseUrl.replace('@bd_main:', '@localhost:');
  }

  return databaseUrl;
}
