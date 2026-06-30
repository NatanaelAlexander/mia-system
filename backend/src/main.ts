import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { factoryValidacion } from './common/pipes/validation.factory';
import { setupSecurity } from './common/security/setup-security';
import { loadSecurityConfig } from './common/security/security.config';
import { setupSwagger } from './common/swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupSecurity(app);

  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: factoryValidacion,
    }),
  );

  if (loadSecurityConfig().swaggerEnabled) {
    setupSwagger(app);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
