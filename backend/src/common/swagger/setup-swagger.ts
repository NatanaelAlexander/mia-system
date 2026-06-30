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
    .addTag('Assets — Internal', 'Archivos en R2 (bucket privado)')
    .addTag('Projects — Internal', 'Proyectos y archivos vinculados')
    .addTag('Projects — Portal', 'Consultas de proyectos para clientes')
    .addTag('Tickets — Internal', 'Tickets, comentarios, estados y archivos')
    .addTag('Tickets — Portal', 'Tickets para clientes')
    .addTag('Audit — Internal', 'Consulta de audit_logs (solo lectura)')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
  });

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    useGlobalPrefix: true,
  });
}
