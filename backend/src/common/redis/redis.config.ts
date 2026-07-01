export function loadRedisUrl(): string {
  return process.env.REDIS_URL?.trim() || 'redis://localhost:6379';
}
