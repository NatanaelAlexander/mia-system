export interface AuthConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresInPortal: string;
  accessExpiresInInternal: string;
  refreshExpiresIn: string;
}

export function loadAuthConfig(): AuthConfig {
  return {
    accessSecret: process.env.JWT_ACCESS_SECRET?.trim() ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET?.trim() ?? '',
    accessExpiresInPortal:
      process.env.JWT_ACCESS_EXPIRES_IN_PORTAL?.trim() || '12h',
    accessExpiresInInternal:
      process.env.JWT_ACCESS_EXPIRES_IN_INTERNAL?.trim() || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN?.trim() || '7d',
  };
}

export function isAuthConfigured(config: AuthConfig): boolean {
  return Boolean(config.accessSecret && config.refreshSecret);
}

const INTERNAL_ROLES = new Set(['admin', 'super_admin']);

export function resolveAccessExpiresIn(
  roles: string[],
  config: AuthConfig,
): string {
  const hasInternalRole = roles.some((role) => INTERNAL_ROLES.has(role));
  return hasInternalRole
    ? config.accessExpiresInInternal
    : config.accessExpiresInPortal;
}

/** Convierte `12h`, `1d`, `15m`… a segundos para la respuesta del login. */
export function parseExpiresInToSeconds(raw: string): number {
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) {
    return 43_200;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 43_200;
  }
}
