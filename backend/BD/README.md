# Base de datos (BD)

Esquema del MER en PostgreSQL. Los `.sql` están en `migration/` por feature. Solo **tablas y relaciones** (sin datos).

## Archivos SQL (`migration/`)

| Orden | Archivo | Contenido |
|-------|---------|-----------|
| 1 | `migration/users.sql` | users, roles, permissions, job_titles y tablas puente |
| 2 | `migration/companies.sql` | companies, representatives, users_companies |
| 3 | `migration/assets.sql` | assets |
| 4 | `migration/projects.sql` | projects, projects_assets |
| 5 | `migration/tickets.sql` | tickets, catálogos, comments, history, assets puente |
| 6 | `migration/audit_logs.sql` | audit_logs |

## Requisitos

- Docker en marcha
- Servicios `bd_main` y `api` levantados (o al menos Postgres)
- Archivo `.env` en la raíz del repo (copiar de `.env.example`)

## Cómo lanzar las migraciones

**Windows y Linux** — desde la raíz del proyecto (`mia-system/`):

```bash
# 1. Levantar el stack (o solo Postgres)
docker compose up --build

# 2. En otra terminal, ejecutar migraciones
docker compose exec api pnpm run migrate
```

`run-migrations.ts` se conecta a Postgres por `DATABASE_URL` y corre cada `.sql` en orden.

Log por feature:

```text
[INFO] Feature: users
[OK] Migración aplicada: users.sql
...
[ERROR] Falló la migración: ...
```

## Verificar tablas

```bash
docker compose exec bd_main psql -U mia_user -d mia_system -c "\dt"
```

## Qué va en Git

- `migration/*.sql`
- `run-migrations.ts`
- Este README

## Qué NO va en Git

- Datos insertados en desarrollo
- Volumen Docker `mia_pg_data`
- Archivo `.env` con credenciales reales

## Reset de esquema (desarrollo)

```bash
docker compose down -v
docker compose up bd_main -d
docker compose exec api pnpm run migrate
```

> `docker compose down -v` borra todos los datos locales de Postgres.
