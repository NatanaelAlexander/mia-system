# mia-system

Backend **NestJS**, frontend **Next.js**, base de datos **PostgreSQL**. Todo corre con Docker.

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

Resumen humano: copia y pega el `.env.example` bajo la misma ruta, pero con el nuevo nombre de `.env`.

Edita `.env` si quieres cambiar contraseñas. No se sube a Git.

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

> Si cambiaste dependencias o Dockerfiles: `docker compose down` y otra vez `docker compose up --build`.

### URLs con el proyecto levantado

| Servicio | URL |
|----------|-----|
| API | http://localhost:3000 |
| Frontend | http://localhost:3001 |
| Postgres (desde tu PC) | `localhost:5432` |

---

## 3. Comandos

**Windows y Linux** — ejecutar desde `mia-system/`:

| Acción | Comando |
|--------|---------|
| Levantar | `docker compose up --build` |
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

**Lo que crees en la BD (usuarios de prueba, tickets, empresas, etc.) vive solo en tu computador**, dentro del volumen Docker `mia_pg_data`. Eso **no se sube al repositorio** con `git add`, `git commit` ni `git push`. Cada persona del equipo tiene su propia BD local; nadie más ve tus datos de desarrollo salvo que tú se los compartas por otro medio.

| Desde | Host | Puerto | DB |
|-------|------|--------|-----|
| Backend (`api`) | `bd_main` | `5432` | `mia_system` |
| Tu PC (DBeaver, etc.) | `localhost` | `5432` | `mia_system` |

El backend **no** usa `localhost` para Postgres:

```text
DATABASE_URL=postgresql://mia_user:TU_PASSWORD@bd_main:5432/mia_system
```

Migraciones SQL: `backend/BD/migration/`. Cómo ejecutarlas: `backend/BD/README.md`.

Zona horaria del stack: `America/Santiago` (configurable con `TZ` y `PGTZ` en `.env`). Postgres guarda `TIMESTAMPTZ` en UTC y lo muestra en hora Chile.

```bash
docker compose exec bd_main psql -U mia_user -d mia_system
```

---

## 5. Frontend

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

## 6. Estructura del repo

```
mia-system/
├── docker-compose.yml
├── .env.example
├── backend/              ← NestJS
│   └── BD/               ← migraciones y script
│       ├── migration/    ← SQL por feature (en Git)
│       └── run-migrations.ts
└── frontend/             ← Next.js
    └── pnpm.sh           ← instalar paquetes sin pnpm local
```

---

## 7. Problemas frecuentes

| Problema | Solución |
|----------|----------|
| Docker no responde (Windows) | Abrir Docker Desktop, esperar *Engine running* |
| Docker no responde (Linux) | `sudo systemctl start docker` |
| Permisos de archivos (Linux) | Con el proyecto parado: `docker run --rm -v "$PWD:/project" alpine:3.22 chown -R $(id -u):$(id -g) /project` |
| Hot reload no funciona (Windows) | Clonar y abrir el proyecto dentro de WSL; el frontend usa `next dev --webpack` con polling |
| Dependencias no se ven | `docker compose down` → `docker compose up --build` |
