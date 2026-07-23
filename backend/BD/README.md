# Base de datos (BD)

Esquema y datos iniciales del MER en PostgreSQL.

## Estructura

```
BD/
├── migration/          ← CREATE TABLE (esquema)
├── data-migration/     ← INSERT (catálogos y seeds dev)
├── run-migrations.ts
├── run-data-migrations.ts
└── README.md
```

---

## 1. Migraciones de esquema (`migration/`)

Solo **tablas y relaciones**.

| Orden | Archivo | Contenido |
|-------|---------|-----------|
| 1 | `users.sql` | users, roles, permissions, job_titles |
| 2 | `companies.sql` | companies, representatives, users_companies |
| 3 | `assets.sql` | assets |
| 4 | `projects.sql` | projects, projects_assets |
| 5 | `tickets.sql` | tickets, catálogos, comments, history |
| 6 | `audit_logs.sql` | audit_logs |

```bash
docker compose exec api pnpm run migrate
```

---

## 2. Data migrations (`data-migration/`)

**INSERT** iniciales por feature. Idempotentes (`ON CONFLICT DO NOTHING`).

| Orden | Archivo | Contenido |
|-------|---------|-----------|
| 1 | `permissions.sql` | Permisos `module:action` |
| 2 | `roles.sql` | Roles y `roles_permissions` (lógica edificio-alcazar) |
| 3 | `tickets.sql` | Estados, prioridades, categorías, pagos |
| 4 | `users.sql` | Usuarios dev super_admin, admin y cliente |
| 5 | `companies.sql` | Empresa demo + vínculo cliente |

```bash
# Después del esquema
docker compose exec api pnpm run migrate:data
```

### Usuarios de desarrollo

| Email | Password | Rol | Notas |
|-------|----------|-----|-------|
| `superadmin@mia.local` | `superadmin` | `super_admin` | Interno, permisos amplios |
| `admin@mia.local` | `admin` | `admin` | Interno |
| `cliente@mia.local` | `cliente` | `cliente` | Externo, empresa demo |

### Roles y permisos (resumen)

| Rol | Alcance |
|-----|---------|
| `super_admin` | Todo excepto `audit_logs:*` |
| `admin` | Operación general sin `system:manage`, roles, permissions, `quotes:*`, `contracts:*`, `company_files:*` ni CRUD usuarios (solo `users:read`) |
| `cliente` | Portal cliente: empresas/proyectos lectura, tickets y comentarios propios |

> El scoping por empresa (cliente solo ve lo suyo) se aplicará en la API; los permisos definen el techo por rol.

### Catálogos de tickets

Estados: Borrador, Creado, Tomado, En desarrollo, QA, Esperando cliente, Terminado, Cancelado.

---

## Requisitos

- Docker en marcha
- Servicios `bd_main` y `api` levantados
- `.env` en la raíz (copiar de `.env.example`)
- Esquema aplicado antes que data (`migrate` → `migrate:data`)

## Reset completo (desarrollo)

```bash
docker compose down -v
docker compose up bd_main -d
docker compose exec api pnpm run migrate
docker compose exec api pnpm run migrate:data
```

## Qué va en Git

- `migration/*.sql`, `data-migration/*.sql`
- Scripts `run-*.ts` y este README

## Qué NO va en Git

- Datos extra que insertes manualmente en dev
- Volumen `mia_pg_data`
- `.env` con credenciales reales
