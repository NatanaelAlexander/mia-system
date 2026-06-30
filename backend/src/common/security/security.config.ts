export interface SecurityConfig {
  corsOrigins: string[];
  trustProxy: boolean;
  swaggerEnabled: boolean;
  throttleTtlMs: number;
  throttleLimit: number;
}

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function loadSecurityConfig(): SecurityConfig {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

  return {
    corsOrigins,
    trustProxy: process.env.TRUST_PROXY === 'true',
    swaggerEnabled:
      process.env.SWAGGER_ENABLED === 'true' ||
      (process.env.SWAGGER_ENABLED !== 'false' && nodeEnv !== 'production'),
    throttleTtlMs: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
    throttleLimit: Number(process.env.THROTTLE_LIMIT ?? 120),
  };
}
