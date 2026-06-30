# Arquitectura backend — mia-system

## Enfoque

**NestJS modular por dominio (Feature Modules)** con dos superficies HTTP:

| Superficie | Quién | Prefijo |
|------------|-------|---------|
| **internal** | Equipo (admin, super_admin) | `/api/internal/*` |
| **portal** | Clientes externos | `/api/portal/*` |

Un feature = un módulo con su controller, service, dto, queries y types. Sin ORM. Sin capas extra.

---

## Flujo de una request

```
Cliente HTTP
    ↓
main.ts  →  ValidationPipe (DTO)  +  AppExceptionFilter
    ↓
XxxController  →  recibe DTO / params, delega
    ↓
XxxService  →  reglas de negocio + ejecuta queries (pg)
    ↓
PostgreSQL
```

El **controller no maneja errores**. El **service** lanza excepciones del dominio. Nest + el filter responden en español.

---

## Capas por feature

```
xxx.controller.ts   →  rutas HTTP (/internal/* y /portal/* declaradas en @Controller)
xxx.service.ts      →  lógica de negocio; llama queries con parámetros ($1, $2…)
queries/            →  SQL del dominio (sin concatenar input del usuario)
types/              →  interfaces (Company, filtros, etc.)
dto/                →  entrada API + class-validator (mensajes en español)
exceptions/         →  excepciones a medida del dominio (extienden AppException)
xxx.module.ts       →  registra controller y service
```

Infra compartida: `common/database/DatabaseService` (pool `pg`). Archivos en **Cloudflare R2** vía `common/storage/R2StorageService` (`@aws-sdk/client-s3`). Esquema de tablas en `backend/BD/migration/*.sql`.

### Qué va en cada capa

| Capa | Responsabilidad | No hace |
|------|-----------------|---------|
| **Controller** | Rutas, `@Body()` / `@Param()`, llamar al service | Reglas de negocio, queries SQL |
| **Service** | Validar reglas, ejecutar queries parametrizadas, lanzar excepciones | Conocer HTTP, armar SQL con strings del usuario |
| **queries/** | Sentencias SQL fijas con `$1`, `$2`… | Lógica de negocio |
| **types/** | Interfaces de filas/objetos internos | Validación HTTP |
| **DTO** | Validar forma del request | Lógica de negocio |
| **exceptions/** | Mensajes de error del dominio en español | — |

---

## Errores (español)

### Formato de respuesta

Todas las respuestas de error usan:

```json
{
  "statusCode": 404,
  "mensaje": "Empresa no encontrada"
}
```

Validación con varios campos:

```json
{
  "statusCode": 400,
  "mensaje": ["El nombre es obligatorio", "El RUT es obligatorio"]
}
```

### Infra compartida

| Archivo | Rol |
|---------|-----|
| `common/exceptions/app.exception.ts` | Clase base `AppException` con campo `mensaje` |
| `common/filters/app-exception.filter.ts` | Filter global → formato `{ statusCode, mensaje }` |
| `common/pipes/validation.factory.ts` | ValidationPipe → errores de DTO en español |

### Uso en el service

```typescript
// companies/exceptions/companies.exceptions.ts
export class EmpresaNoEncontradaException extends AppException {
  constructor() {
    super('Empresa no encontrada', HttpStatus.NOT_FOUND);
  }
}

// companies.service.ts
throw new EmpresaNoEncontradaException();
```

Cada feature define sus excepciones en `exceptions/`. No usar strings sueltos con `NotFoundException` de Nest.

---

## Rutas y controllers

Las rutas **internal** y **portal** se declaran en el **mismo feature**, en `xxx.controller.ts`, con `@Controller` distintos:

```typescript
@Controller('internal/companies')
export class InternalCompaniesController { ... }

@Controller('portal/companies')
export class PortalCompaniesController { ... }
```

No hay carpetas `internal/` ni `portal/` dentro del feature. No hay RouterModule ni módulos derivadores.

Prefix global en `main.ts`: `api` → ruta final `/api/internal/companies`.

### Convención GET

Los **GET que necesitan filtros** (id, companyId, etc.) **no usan parámetros en la URL**. Reciben un DTO por **body**:

| Antes | Ahora |
|-------|-------|
| `GET /internal/companies/:id` | `GET /internal/companies/detalle` + body `{ "id": "uuid" }` |
| `GET /internal/companies/:id/representatives` | `GET /internal/companies/representantes` + body `{ "companyId": "uuid" }` |

Los GET de listado sin filtros (`GET /internal/companies`) no llevan body.

`PATCH`, `DELETE` y `POST` con recurso puntual pueden seguir usando `:id` en la URL.

---

## Swagger

Documentación interactiva en **`/api/docs`** (JSON en `/api/docs/json`).

- DTOs con `@ApiProperty` → request body documentado y probabile desde la UI.
- `dto/responses/` → schemas de respuesta.
- `@ApiOperation`, `@ApiBody`, `@ApiOkResponse` en cada endpoint.

Configuración: `common/swagger/setup-swagger.ts`, se llama desde `main.ts`.

---

## Árbol de carpetas (actual + pendiente)

```
backend/src/
├── main.ts                              ← prefix api, ValidationPipe, AppExceptionFilter
├── app.module.ts
│
├── common/
│   ├── database/
│   │   ├── database.module.ts         ← Pool pg (global)
│   │   ├── database.service.ts        ← query(text, params)
│   │   └── database-url.ts            ← DATABASE_URL desde .env
│   ├── exceptions/
│   │   └── app.exception.ts
│   ├── filters/
│   │   └── app-exception.filter.ts
│   ├── pipes/
│   │   └── validation.factory.ts
│   ├── swagger/
│   │   └── setup-swagger.ts           ← /api/docs
│   ├── storage/
│   │   ├── storage.module.ts          ← R2 (S3 API)
│   │   ├── r2-storage.service.ts
│   │   ├── r2.config.ts
│   │   └── r2.types.ts
│   ├── guards/                          ← (pendiente)
│   ├── decorators/                      ← (pendiente)
│   └── types/                           ← (pendiente: auth-user, etc.)
│
├── companies/                           ← ✅ implementado
│   ├── companies.module.ts
│   ├── companies.controller.ts
│   ├── companies.service.ts
│   ├── queries/
│   ├── types/
│   ├── dto/
│   └── exceptions/
│
├── auth/                                ← (pendiente)
│   ├── auth.module.ts
│   ├── auth.controller.ts               → /api/auth/*
│   ├── auth.service.ts
│   └── dto/
│
├── users/                               ← (pendiente)
│   ├── users.module.ts
│   ├── users.controller.ts              → /api/internal/users
│   ├── users.service.ts
│   ├── dto/
│   ├── exceptions/
│   ├── queries/
│   └── types/
│
├── assets/                              ← ✅ implementado
│   ├── assets.module.ts
│   ├── assets.controller.ts
│   ├── assets.service.ts
│   ├── queries/
│   ├── types/
│   ├── dto/
│   └── exceptions/
│
├── projects/                            ← ✅ implementado
│   ├── projects.module.ts
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   ├── queries/
│   ├── types/
│   ├── dto/
│   └── exceptions/
│
├── tickets/                             ← (pendiente)
│   ├── tickets.module.ts
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   ├── ticket-comments.service.ts       ← solo si el dominio lo requiere
│   ├── dto/
│   ├── exceptions/
│   ├── queries/
│   └── types/
│
└── audit/                               ← ✅ implementado (solo internal, lectura)
    ├── audit.module.ts
    ├── audit.controller.ts
    ├── audit.service.ts                  ← log() exportado para conectar después
    ├── queries/
    ├── types/
    ├── dto/
    └── exceptions/
```

---

## Companies (referencia)

### Rutas internal

| Método | Ruta | Body |
|--------|------|------|
| GET | `/api/internal/companies` | — |
| GET | `/api/internal/companies/detalle` | `{ "id": "uuid" }` |
| POST | `/api/internal/companies` | `CreateCompanyDto` |
| PATCH | `/api/internal/companies/:id` | `UpdateCompanyDto` |
| DELETE | `/api/internal/companies/:id` | — (soft: inactive) |
| GET | `/api/internal/companies/representantes` | `{ "companyId": "uuid" }` |
| POST | `/api/internal/companies/:id/representatives` | `LinkRepresentativeDto` |
| DELETE | `/api/internal/companies/:id/representatives/:legalRepresentativeId` | — |
| GET | `/api/internal/legal-representatives` | — |
| GET | `/api/internal/legal-representatives/detalle` | `{ "id": "uuid" }` |
| POST | `/api/internal/legal-representatives` | `CreateLegalRepresentativeDto` |
| PATCH | `/api/internal/legal-representatives/:id` | `UpdateLegalRepresentativeDto` |

### Rutas portal

| Método | Ruta | Estado |
|--------|------|--------|
| GET | `/api/portal/companies` | Stub (falta auth + filtro por `users_companies`) |

### Excepciones del dominio

| Excepción | HTTP | Mensaje |
|-----------|------|---------|
| `EmpresaNoEncontradaException` | 404 | Empresa no encontrada |
| `RepresentanteLegalNoEncontradoException` | 404 | Representante legal no encontrado |
| `VinculoEmpresaRepresentanteNoEncontradoException` | 404 | Vínculo empresa-representante no encontrado |
| `RutEmpresaDuplicadoException` | 409 | Ya existe una empresa con ese RUT |
| `RepresentanteYaVinculadoException` | 409 | El representante ya está vinculado a esta empresa |

---

## Features ↔ módulos

| Módulo | Tablas principales | Internal | Portal | Estado |
|--------|-------------------|----------|--------|--------|
| auth | users, roles | — | — | pendiente |
| users | users, users_roles, job_titles | ✓ | — | pendiente |
| companies | companies, legal_representatives, company_representatives | ✓ | stub | ✅ (+ audit en todas las APIs) |
| projects | projects, projects_assets | ✓ | stub | ✅ (+ audit en todas las APIs) |
| assets | assets | ✓ | — | ✅ |
| tickets | tickets, catálogos, comments | ✓ | ✓ | pendiente |
| audit | audit_logs | ✓ | — | ✅ (lectura; log() listo para conectar) |

---

## Reglas entre módulos

- Un módulo **importa el service** de otro si necesita su lógica; **nunca** su controller.
- Un **service por dominio**; métodos distintos si internal y portal necesitan comportamiento diferente (`findAll` vs `findAllForUser`).
- **Auth, JWT y guards**: última fase. Se agregan en `common/guards` sin mezclar lógica de permisos dentro de los services.
- **BD**: esquema vía migraciones SQL en `backend/BD/migration/`. Acceso en runtime con `pg` y queries parametrizadas (`$1`, `$2`). **Sin ORM.**
- **Credenciales**: solo desde `.env` (`DATABASE_URL`, `R2_*`). Sin valores hardcodeados.

---

## Assets y Cloudflare R2

Metadata en Postgres (`assets`). El binario en **R2 (bucket privado)**. En `file_path` va el **object key**, no una URL pública.

```
Upload → R2StorageService.upload() → key privado en R2
       → INSERT assets (file_path = key)

Download → API valida permisos → getSignedDownloadUrl(key) → URL temporal
```

Variables: `R2_ENDPOINT_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_SYSTEM`. **Sin** dominio público ni `r2.dev`.

---

## Checklist al crear un feature nuevo

1. Crear carpeta `backend/src/xxx/` con la estructura estándar.
2. Alinear `queries/` con tablas de `backend/BD/migration/`.
3. `types/` con interfaces de filas que devuelve el SQL.
4. `dto/` con mensajes de validación en español.
5. `exceptions/` con clases que extienden `AppException`.
6. `xxx.controller.ts` con rutas `/internal/...` y `/portal/...` según corresponda.
7. `xxx.service.ts`: solo valores en `params` de `db.query()`; nunca interpolar input en el SQL.
8. Registrar módulo en `app.module.ts`.

---

## Pendiente global

- [ ] Auth (JWT, login, refresh)
- [ ] Guards: internal, portal, permissions (`module:action`)
- [ ] Decorators: `@CurrentUser()`, `@RequirePermission()`
- [ ] Portal companies: filtrar por `users_companies`
- [x] Swagger en `/api/docs`
