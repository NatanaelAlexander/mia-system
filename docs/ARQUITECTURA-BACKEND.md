# Arquitectura backend — mia-system

## Enfoque

**NestJS modular por dominio (Feature Modules)** con dos superficies HTTP:

| Superficie | Quién | Prefijo |
|------------|-------|---------|
| **internal** | Equipo (admin, super_admin) | `/api/internal/*` |
| **portal** | Clientes externos | `/api/portal/*` |

Un feature = un módulo con su controller, service, dto, entities. Sin capas extra.

---

## Flujo de una request

```
Cliente HTTP
    ↓
main.ts  →  ValidationPipe (DTO)  +  AppExceptionFilter
    ↓
XxxController  →  recibe DTO / params, delega
    ↓
XxxService  →  reglas de negocio + TypeORM
    ↓
PostgreSQL
```

El **controller no maneja errores**. El **service** lanza excepciones del dominio. Nest + el filter responden en español.

---

## Capas por feature

```
xxx.controller.ts   →  rutas HTTP (/internal/* y /portal/* declaradas en @Controller)
xxx.service.ts      →  lógica de negocio + acceso a BD
dto/                →  entrada API + class-validator (mensajes en español)
exceptions/         →  excepciones a medida del dominio (extienden AppException)
types/              →  interfaces internas (solo si el service las necesita)
entities/           →  TypeORM (mapeo a tablas PostgreSQL)
xxx.module.ts       →  registra controller, service, TypeOrmModule.forFeature
```

### Qué va en cada capa

| Capa | Responsabilidad | No hace |
|------|-----------------|---------|
| **Controller** | Rutas, `@Body()` / `@Param()`, llamar al service | Reglas de negocio, queries SQL |
| **Service** | Validar reglas, leer/escribir BD, lanzar excepciones | Conocer HTTP, status codes |
| **DTO** | Validar forma del request | Lógica de negocio |
| **exceptions/** | Mensajes de error del dominio en español | — |
| **types/** | Tipos/interfaces para el service | Validación HTTP |
| **entities/** | Definición de tablas TypeORM | Lógica de negocio |

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

---

## Árbol de carpetas (actual + pendiente)

```
backend/src/
├── main.ts                              ← prefix api, ValidationPipe, AppExceptionFilter
├── app.module.ts
│
├── common/
│   ├── database/
│   │   ├── database.module.ts         ← TypeORM, synchronize: false
│   │   └── database-url.ts            ← DATABASE_URL desde .env
│   ├── exceptions/
│   │   └── app.exception.ts
│   ├── filters/
│   │   └── app-exception.filter.ts
│   ├── pipes/
│   │   └── validation.factory.ts
│   ├── guards/                          ← (pendiente)
│   ├── decorators/                      ← (pendiente)
│   └── types/                           ← (pendiente: auth-user, etc.)
│
├── companies/                           ← ✅ implementado
│   ├── companies.module.ts
│   ├── companies.controller.ts
│   ├── companies.service.ts
│   ├── dto/
│   ├── exceptions/
│   ├── types/
│   └── entities/
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
│   ├── types/
│   └── entities/
│
├── projects/                            ← (pendiente)
│   ├── projects.module.ts
│   ├── projects.controller.ts           → /api/internal/projects, /api/portal/projects
│   ├── projects.service.ts
│   ├── dto/
│   ├── exceptions/
│   ├── types/
│   └── entities/
│
├── assets/                              ← (pendiente)
│   └── … (misma estructura)
│
├── tickets/                             ← (pendiente)
│   ├── tickets.module.ts
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   ├── ticket-comments.service.ts       ← solo si el dominio lo requiere
│   ├── dto/
│   ├── exceptions/
│   ├── types/
│   └── entities/
│
└── audit/                               ← (pendiente, solo internal)
    ├── audit.module.ts
    ├── audit.controller.ts              → /api/internal/audit-logs
    ├── audit.service.ts
    ├── dto/
    ├── exceptions/
    └── entities/
```

---

## Companies (referencia)

### Rutas internal

| Método | Ruta |
|--------|------|
| GET | `/api/internal/companies` |
| GET | `/api/internal/companies/:id` |
| POST | `/api/internal/companies` |
| PATCH | `/api/internal/companies/:id` |
| DELETE | `/api/internal/companies/:id` (soft: inactive) |
| GET | `/api/internal/companies/:id/representatives` |
| POST | `/api/internal/companies/:id/representatives` |
| DELETE | `/api/internal/companies/:id/representatives/:legalRepresentativeId` |
| GET | `/api/internal/legal-representatives` |
| GET | `/api/internal/legal-representatives/:id` |
| POST | `/api/internal/legal-representatives` |
| PATCH | `/api/internal/legal-representatives/:id` |

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
| companies | companies, legal_representatives, company_representatives | ✓ | stub | ✅ |
| projects | projects, projects_assets | ✓ | ✓ | pendiente |
| assets | assets | ✓ | ✓ | pendiente |
| tickets | tickets, catálogos, comments | ✓ | ✓ | pendiente |
| audit | audit_logs | ✓ | — | pendiente |

---

## Reglas entre módulos

- Un módulo **importa el service** de otro si necesita su lógica; **nunca** su controller.
- Un **service por dominio**; métodos distintos si internal y portal necesitan comportamiento diferente (`findAll` vs `findAllForUser`).
- **Auth, JWT y guards**: última fase. Se agregan en `common/guards` sin mezclar lógica de permisos dentro de los services.
- **BD**: `synchronize: false`. Esquema vía migraciones SQL en `backend/BD/migration/`. Seeds en `backend/BD/data-migration/`.
- **Credenciales**: solo desde `.env` (`DATABASE_URL`). Sin valores hardcodeados.

---

## Checklist al crear un feature nuevo

1. Crear carpeta `backend/src/xxx/` con la estructura estándar.
2. `entities/` alineadas a migraciones SQL existentes.
3. `dto/` con mensajes de validación en español.
4. `exceptions/` con clases que extienden `AppException`.
5. `xxx.controller.ts` con rutas `/internal/...` y `/portal/...` según corresponda.
6. `xxx.service.ts` con la lógica; lanzar excepciones del dominio, no strings sueltos.
7. Registrar módulo en `app.module.ts`.

---

## Pendiente global

- [ ] Auth (JWT, login, refresh)
- [ ] Guards: internal, portal, permissions (`module:action`)
- [ ] Decorators: `@CurrentUser()`, `@RequirePermission()`
- [ ] Portal companies: filtrar por `users_companies`
- [ ] Swagger (opcional, no bloqueante)
