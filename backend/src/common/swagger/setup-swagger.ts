import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ErrorResponseDto } from '../exceptions/app.exception';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('mia-system API')
    .setDescription(
      'API del sistema de gestión. Los GET que requieren filtros reciben datos por body, no por URL.',
    )
    .setVersion('1.0')
    .addTag('Companies — Internal', 'Gestión interna de empresas y representantes')
    .addTag('Companies — Portal', 'Consultas de empresas para clientes')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
  });

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
  });
}
