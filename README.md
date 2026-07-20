# mia-system

Backend **NestJS**, frontend **Next.js**, base de datos **PostgreSQL**. Todo corre con Docker.

Documentación adicional:

- Requerimientos: `docs/REQUERIMIENTOS.md`
- Arquitectura backend: `docs/ARQUITECTURA-BACKEND.md`
- Migraciones BD: `backend/BD/README.md`

---

## Descripción general

**mia-system** es un CRM / plataforma de gestión de clientes orientada a equipos internos y a clientes externos (portal). Centraliza la operación comercial y de soporte en un solo lugar: empresas, proyectos, tickets, cotizaciones y colaboradores con permisos.

### Finalidad

Dar visibilidad y control sobre el ciclo de trabajo con cada cliente: desde la relación comercial (empresas, representantes, cotizaciones) hasta la ejecución (proyectos y tickets), con colaboración en tiempo real entre el equipo interno y los usuarios del cliente.

### Qué permite

- **Empresas y proyectos:** alta y seguimiento de clientes, vinculación de usuarios/portal y organización del trabajo por proyecto.
- **Tickets:** conversaciones, estados, adjuntos y responsables; el equipo interno colabora con políticas de acceso por rol (p. ej. Superadmin vs Admin).
- **Cotizaciones:** emisión y gestión de documentos comerciales (vista previa / PDF, estados, enlace público temporal de revisión).
- **Colaboradores y permisos:** RBAC (roles y permisos) para controlar qué puede ver o hacer cada persona en el panel interno o en el portal.
- **Tiempo real y notificaciones:** presencia, actualización de tickets/chat y avisos de cambios o mensajes de clientes sin recargar la página.

### Superficies

| Superficie | Quién | Uso típico |
|------------|--------|------------|
| **Internal** | Equipo (Superadmin, Admin, …) | Operación completa según permisos |
| **Portal** | Clientes vinculados a su empresa | Ver proyectos/tickets y participar en el chat público |

### Tecnologías relevantes

| Tecnología | Rol en el proyecto |
|------------|--------------------|
| **NestJS** + **Next.js** | API tipada y UI moderna; monorepo operativo con Docker |
| **PostgreSQL** | Fuente de verdad (empresas, tickets, cotizaciones, RBAC) |
| **JWT** | Autenticación / sesión (access + refresh) y autorización en APIs |
| **Socket.IO** (WebSockets) | Chat de tickets, presencia y eventos en vivo |
| **Redis** | Infra de apoyo en el stack Docker (tiempo real / caché / servicios auxiliares según configuración) |
| **Docker Compose** | Entorno reproducible (Postgres, Redis, API, frontend) |

---

## 1. Requisitos previos

Terminal abierta en la carpeta `mia-system/`.

### Windows

1. Instalar [Docker Desktop](https://www.docker.com/products/docker-desktop/) con **WSL2** activado.
2. Reiniciar el PC si el instalador lo pide.
3. **Antes de trabajar:** abrir **Docker Desktop** y esperar *Engine running*.
4. Usar **PowerShell**, **Git Bash** o terminal de VS Code / Cursor.

```powershell
cd C:\ruta\donde\clonaste\mia-system
docker ps
```

Si `docker ps` muestra una tabla (aunque esté vacía), Docker está OK.

### Linux

1. Instalar **Docker Engine** o Docker Desktop.
2. Levantar el servicio:

```bash
sudo systemctl start docker
```

3. Si sale `permission denied` al usar Docker:

```bash
sudo usermod -aG docker $USER
```

Cerrar sesión y volver a entrar.

4. Ir al proyecto y comprobar:

```bash
cd ~/ruta/al/mia-system
docker ps
```

---

## 2. Levantar el proyecto

### Paso 1 — Variables de entorno (solo la primera vez)

**Windows y Linux:**

```bash
cp .env.example .env
```

Edita `.env` si quieres cambiar contraseñas. `DATABASE_URL` debe usar el mismo usuario, contraseña y base que `POSTGRES_*`. No se sube a Git.

### Paso 2 — Bajar contenedores anteriores

**Windows y Linux.** Siempre antes de un nuevo `up --build`:

```bash
docker compose down
```

Libera memoria, puertos y evita conflictos con contenedores viejos. **No borra los datos de Postgres** (quedan en el volumen `mia_pg_data`).

### Paso 3 — Levantar todo

**Windows y Linux:**

```bash
docker compose up --build
```

Levanta `bd_main` (Postgres), `api` (Nest) y `frontend` (Next). Verás los logs en la terminal.

Parar: `Ctrl + C`.

> Si cambiaste dependencias (`package.json`) o Dockerfiles: `docker compose down` y otra vez `docker compose up --build`. Si el API no encuentra un paquete nuevo: `docker compose exec api pnpm install` y `docker compose restart api`.

### Paso 4 — Migraciones de base de datos (primera vez o tras `down -v`)

**`docker compose up --build` no corre las migraciones solo.** Con el stack arriba, en **otra terminal**:

**Windows y Linux:**

```bash
# Esquema (tablas)
docker compose exec api pnpm run migrate

# Datos iniciales (roles, estados, admin, cliente)
docker compose exec api pnpm run migrate:data
```

| Comando | Qué hace |
|---------|----------|
| `pnpm run migrate` | Crea las tablas (`backend/BD/migration/`) |
| `pnpm run migrate:data` | Inserta catálogos y usuarios dev (`backend/BD/data-migration/`) |

Solo hace falta repetirlos si borraste la BD (`docker compose down -v`) o si cambiaste los `.sql`.

Usuarios de desarrollo (tras `migrate:data`):

| Email | Contraseña | Rol |
|-------|------------|-----|
| `admin@mia.local` | `admin` | admin |
| `cliente@mia.local` | `cliente` | cliente |

### URLs con el proyecto levantado

| Servicio | URL | Notas |
|----------|-----|-------|
| Health check (API) | http://localhost:3000/ | Respuesta simple; sin prefijo `/api` |
| API REST (base) | http://localhost:3000/api | Ej: `/api/internal/companies` |
| Swagger | http://localhost:3000/api/docs | Documentación y prueba de endpoints |
| OpenAPI JSON | http://localhost:3000/api/docs/json | Esquema para herramientas |
| Frontend | http://localhost:3001 | Next.js |
| Postgres (desde tu PC) | `localhost:5432` | Usuario/DB según `.env` (`mia_user` / `mia_system` por defecto) |

---

## 3. Comandos

**Windows y Linux** — ejecutar desde `mia-system/`:

| Acción | Comando |
|--------|---------|
| Levantar | `docker compose up --build` |
| Migrar esquema (tablas) | `docker compose exec api pnpm run migrate` |
| Migrar datos iniciales | `docker compose exec api pnpm run migrate:data` |
| Instalar deps del API (si falla compilación) | `docker compose exec api pnpm install` |
| Detener | `docker compose down` |
| Reset total (incluye datos de Postgres) | `docker compose down -v` |
| Estado | `docker compose ps` |
| Logs (todos) | `docker compose logs -f` |
| Logs de un servicio | `docker compose logs -f api` |
| Reiniciar un servicio | `docker compose restart api` |
| Solo Postgres | `docker compose up bd_main` |

---

## 4. Base de datos

Servicio Docker: `bd_main`. Datos en volumen `mia_pg_data` (local en tu PC).

### Datos, Git y `docker compose down`

| Qué haces | ¿Qué pasa con los datos de la BD? |
|-----------|-----------------------------------|
| `docker compose down` | **Se conservan** |
| `Ctrl + C` / volver a `up --build` | **Se conservan** |
| `git push` | **No se suben** (Git no ve el volumen Docker) |
| `docker compose down -v` | **Se borran** (reset total) |

En Git van el **esquema** (`backend/BD/migration/*.sql`) y `.env.example`. No van `.env` ni las filas que insertes en desarrollo.

**Lo que crees en la BD (usuarios de prueba, tickets, empresas, etc.) vive solo en tu computador**, dentro del volumen Docker `mia_pg_data`. Eso **no se sube al repositorio** con `git add`, `git commit` ni `git push`.

| Desde | Host | Puerto | DB |
|-------|------|--------|-----|
| Backend (`api`) | `bd_main` | `5432` | valor de `POSTGRES_DB` en `.env` |
| Tu PC (DBeaver, etc.) | `localhost` | `POSTGRES_PORT` en `.env` (default `5432`) | valor de `POSTGRES_DB` en `.env` |

El backend **dentro de Docker** no usa `localhost` para Postgres:

```text
DATABASE_URL=postgresql://POSTGRES_USER:POSTGRES_PASSWORD@bd_main:5432/POSTGRES_DB
```

Migraciones SQL: `backend/BD/migration/` y `backend/BD/data-migration/`.

Zona horaria del stack: `America/Santiago` (configurable con `TZ` y `PGTZ` en `.env`).

```bash
docker compose exec bd_main psql -U mia_user -d mia_system
```

(Ajusta usuario y DB si cambiaste `.env`.)

### Archivos (Cloudflare R2)

Metadata en Postgres (`assets`). El binario en **R2 (bucket privado)**. Variables en `.env`:

- `R2_ENDPOINT_URL` — API S3
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_SYSTEM` — bucket **sin** acceso público

En BD guardas el **key** de R2 (`file_path`). La descarga pasa por el API (URL firmada temporal).

---

## 5. API y Swagger

- Prefijo global: `/api`
- Superficies: `/api/internal/*` (equipo) y `/api/portal/*` (clientes)
- **Auth:** `POST /api/auth/login` y `POST /api/auth/refresh`. Rutas internal/portal requieren header `Authorization: Bearer <accessToken>`
- Access token: **12h** (rol `cliente` / portal), **1d** (admin / super_admin)
- Errores en español: `{ "statusCode": number, "mensaje": string | string[] }`
- Los **GET con filtros** (por ID, etc.) reciben datos por **body**, no por URL

Ejemplos:

```text
POST http://localhost:3000/api/auth/login          body: { "email": "admin@mia.local", "password": "admin" }
GET  http://localhost:3000/api/internal/companies    header: Authorization: Bearer <token>
GET  http://localhost:3000/api/portal/companies      header: Authorization: Bearer <token>
```

---

## 6. Frontend

- Tailwind v4 → `frontend/src/app/globals.css`
- Iconos → `lucide-react`

Instalar paquetes (**Windows y Linux**):

```bash
./frontend/pnpm.sh add <paquete>
```

En Windows, si falla en PowerShell: `bash frontend/pnpm.sh add <paquete>`.

**Pages y components (espejo):** misma ruta de carpetas.

| Ruta | Page | Component |
|------|------|-----------|
| `/login` | `src/app/login/` | `src/app/components/login/` |
| `/app` | `src/app/app/` | `src/app/components/app/` |

---

## 7. Estructura del repo

```
mia-system/
├── docker-compose.yml
├── .env.example
├── docs/
│   ├── REQUERIMIENTOS.md
│   └── ARQUITECTURA-BACKEND.md
├── backend/                    ← NestJS
│   ├── src/
│   │   ├── main.ts             ← prefix /api, Swagger, validación
│   │   ├── common/             ← database (pg), filters, exceptions, swagger
│   │   └── companies/          ← queries + types + controller + service
│   └── BD/
│       ├── migration/          ← esquema (CREATE)
│       ├── data-migration/     ← datos (INSERT)
│       ├── run-migrations.ts
│       └── run-data-migrations.ts
└── frontend/                   ← Next.js
    └── pnpm.sh                 ← instalar paquetes sin pnpm local
```

---

## 8. Problemas frecuentes

| Problema | Solución |
|----------|----------|
| Docker no responde (Windows) | Abrir Docker Desktop, esperar *Engine running* |
| Docker no responde (Linux) | `sudo systemctl start docker` |
| Permisos de archivos (Linux) | Con el proyecto parado: `docker run --rm -v "$PWD:/project" alpine:3.22 chown -R $(id -u):$(id -g) /project` |
| Hot reload no funciona (Windows) | Clonar y abrir el proyecto dentro de WSL; el frontend usa `next dev --webpack` con polling |
| Dependencias no se ven | `docker compose exec api pnpm install` → `docker compose restart api` |
| API no compila (`Cannot find module …`) | `docker compose exec api pnpm install` y reiniciar `api` |
| Swagger 404 | Comprobar que `api` compiló sin errores; URL correcta: http://localhost:3000/api/docs |
| Error SASL / password Postgres | Revisar que `.env` exista y que `DATABASE_URL` coincida con `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` |
