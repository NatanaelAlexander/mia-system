import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ErrorResponseDto } from '../exceptions/app.exception';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('mia-system API')
    .setDescription(
      'API del sistema de gestión. Los GET que requieren filtros reciben datos por body, no por URL. Rutas internal/portal requieren Authorization: Bearer <accessToken>.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token de POST /api/auth/login',
      },
      'access-token',
    )
    .addTag('Auth', 'Login y renovación de tokens (JWT)')
    .addTag('Auth — Admin', 'Herramientas de autorización (system:manage)')
    .addTag('Users — Internal', 'Gestión de usuarios, roles y vínculos con empresas')
    .addTag('Users — Perfil', 'Perfil y contraseña del usuario autenticado')
    .addTag('Users — Portal', 'Perfil del cliente en portal')
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

  // OpenAPI JSON para herramientas (Postman, Insomnia, etc.)
  app.getHttpAdapter().get('/api/docs/json', (_req: unknown, res: { json: (body: unknown) => void }) => {
    res.json(document);
  });

  // Scalar UI (sidebar + Try it out); OpenAPI lo genera @nestjs/swagger.
  app.use(
    '/api/reference',
    apiReference({
      content: document,
    }),
  );
}
