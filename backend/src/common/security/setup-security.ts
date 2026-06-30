import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { loadSecurityConfig } from './security.config';

export function setupSecurity(app: INestApplication): void {
  const config = loadSecurityConfig();

  if (config.trustProxy) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  if (config.corsOrigins.length > 0) {
    app.enableCors({
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  }
}
