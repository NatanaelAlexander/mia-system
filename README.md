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

Edita `.env` si quieres cambiar contraseñas. No se sube a Git.

### Paso 2 — Bajar contenedores anteriores

**Windows y Linux.** Siempre antes de un nuevo `up --build`:

```bash
docker compose down
```

Libera memoria, puertos y evita conflictos con contenedores viejos.

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

Servicio Docker: `bd_main`. Datos en volumen `mia_pg_data` (local, no va a Git).

| Desde | Host | Puerto | DB |
|-------|------|--------|-----|
| Backend (`api`) | `bd_main` | `5432` | `mia_system` |
| Tu PC (DBeaver, etc.) | `localhost` | `5432` | `mia_system` |

El backend **no** usa `localhost` para Postgres:

```text
DATABASE_URL=postgresql://mia_user:TU_PASSWORD@bd_main:5432/mia_system
```

Migraciones SQL: `backend/BD/migration/`.

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
│   └── BD/migration/     ← SQL (en Git)
└── frontend/             ← Next.js
    └── pnpm.sh           ← instalar paquetes sin pnpm local
```

---

## 7. Problemas frecuentes

<<<<<<< Updated upstream
### "Cannot connect to the Docker daemon" / Docker no responde

Docker no está encendido. Vuelve a la sección **Windows** o **Linux** y enciende Docker antes de seguir.

### No puedo guardar archivos en el editor (solo Linux)

A veces Docker deja archivos como `root`. Con el proyecto **parado** (`docker compose down`):

```bash
docker run --rm -v "$PWD:/project" alpine:3.22 chown -R $(id -u):$(id -g) /project
```

### Cambié dependencias y el contenedor no las ve

```bash
docker compose down
docker compose up --build
```
=======
| Problema | Solución |
|----------|----------|
| Docker no responde (Windows) | Abrir Docker Desktop, esperar *Engine running* |
| Docker no responde (Linux) | `sudo systemctl start docker` |
| Permisos de archivos (Linux) | Con el proyecto parado: `docker run --rm -v "$PWD:/project" alpine:3.22 chown -R $(id -u):$(id -g) /project` |
| Hot reload no funciona (Windows) | Clonar y abrir el proyecto dentro de WSL |
| Dependencias no se ven | `docker compose down` → `docker compose up --build` |
>>>>>>> Stashed changes
