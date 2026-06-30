# Arquitectura backend — mia-system

## Nombre y enfoque

**Arquitectura modular por dominio (NestJS Feature Modules)** con **dos superficies HTTP**: `internal` (equipo) y `portal` (clientes).

## Problemas que resuelve

| Problema | Solución |
|----------|----------|
| Clientes e internos comparten BD pero no los mismos flujos | Controllers separados: `/internal/*` y `/portal/*` |
| Duplicar lógica entre internal y portal | Un `XxxService` por dominio con métodos según audiencia |
| Crecer por features (tickets, projects…) | Un módulo Nest por feature del MER |
| Permisos y auth (más adelante) | `common/guards` + `@RequirePermission` sin mezclar en services |
| Acoplamiento entre dominios | Services exportados; un módulo importa el service de otro, no su controller |

## Capas por feature

```
Controller (internal | portal)  →  HTTP, DTOs
Service                         →  reglas de negocio
Entity / TypeORM                →  PostgreSQL
```

Auth, JWT y guards: **pendiente** (última fase).

---

## Árbol de carpetas

```
backend/src/
├── main.ts
├── app.module.ts
│
├── common/                              ← infra compartida
│   ├── database/
│   │   ├── database.module.ts
│   │   └── database.config.ts
│   ├── guards/                          ← (pendiente: JWT, internal, portal)
│   │   ├── jwt-auth.guard.ts
│   │   ├── internal.guard.ts
│   │   ├── portal.guard.ts
│   │   └── permissions.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── require-permission.decorator.ts
│   ├── filters/
│   ├── interceptors/
│   └── types/
│       └── auth-user.type.ts
│
├── auth/                                ← (pendiente)
│   ├── auth.module.ts
│   ├── auth.controller.ts               → /auth/*
│   ├── auth.service.ts
│   └── dto/
│
├── users/                               ← gestión usuarios (solo internal)
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── entities/
│   ├── dto/
│   └── internal/
│       └── internal-users.controller.ts → /internal/users
│
├── companies/                           ← ✅ en implementación
│   ├── companies.module.ts
│   ├── companies.service.ts
│   ├── entities/
│   ├── dto/
│   ├── internal/
│   │   └── internal-companies.controller.ts   → /internal/companies
│   └── portal/
│       └── portal-companies.controller.ts     → /portal/companies
│
├── projects/
│   ├── projects.module.ts
│   ├── projects.service.ts
│   ├── entities/
│   ├── dto/
│   ├── internal/
│   │   └── internal-projects.controller.ts    → /internal/projects
│   └── portal/
│       └── portal-projects.controller.ts      → /portal/projects
│
├── assets/
│   ├── assets.module.ts
│   ├── assets.service.ts
│   ├── entities/
│   ├── dto/
│   ├── internal/
│   │   └── internal-assets.controller.ts      → /internal/assets
│   └── portal/
│       └── portal-assets.controller.ts        → /portal/assets
│
├── tickets/
│   ├── tickets.module.ts
│   ├── tickets.service.ts
│   ├── ticket-comments.service.ts
│   ├── ticket-status.service.ts
│   ├── entities/
│   ├── dto/
│   ├── internal/
│   │   └── internal-tickets.controller.ts     → /internal/tickets
│   └── portal/
│       └── portal-tickets.controller.ts       → /portal/tickets
│
└── audit/
    ├── audit.module.ts
    ├── audit.service.ts
    ├── entities/
    └── internal/
        └── internal-audit.controller.ts       → /internal/audit-logs
```

## Features ↔ módulos

| Módulo | Tablas | Internal | Portal |
|--------|--------|----------|--------|
| auth | users, roles | pendiente | pendiente |
| users | users, users_roles | ✓ | — |
| companies | companies, legal_representatives, company_representatives | ✓ | ✓ (stub) |
| projects | projects, projects_assets | pendiente | pendiente |
| assets | assets | pendiente | pendiente |
| tickets | tickets, catálogos, comments | pendiente | pendiente |
| audit | audit_logs | pendiente | — |
