# mia-system

Proyecto con **backend NestJS** y **frontend Next.js**.

Todo el desarrollo corre con **Docker**. No hace falta instalar Node ni pnpm en tu computador.

---

## Antes de empezar (lee esto primero)

1. Instala **Docker** en tu sistema (ver sección Windows o Linux abajo).
2. **Enciende Docker** antes de ejecutar cualquier comando.
3. Abre una terminal en la carpeta del proyecto (`mia-system/`).
4. Usa los comandos de la sección **Comandos globales**.

---

## Windows

### 1. Instalar Docker

1. Descarga e instala [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. Durante la instalación, deja activado **WSL2** (es lo recomendado).
3. Reinicia el PC si te lo pide el instalador.

### 2. Encender Docker (hacerlo siempre antes de trabajar)

1. Abre **Docker Desktop** desde el menú Inicio.
2. Espera a que abajo diga **Engine running** (motor en marcha).
3. Si no está encendido, nada de lo demás va a funcionar.

### 3. Abrir terminal en el proyecto

Usa **PowerShell**, **Git Bash** o la terminal de **VS Code / Cursor**.

```powershell
cd C:\ruta\donde\clonaste\mia-system
```

> Cambia la ruta por la carpeta real donde tienes el repo.

### 4. Comprobar que Docker responde

```powershell
docker ps
```

- Si ves una tabla (aunque esté vacía) → Docker está OK.
- Si sale error → abre Docker Desktop y espera a que arranque.

### 5. Instalar paquetes npm en el frontend (Windows)

Con **Git Bash** o **WSL**:

```bash
./frontend/pnpm.sh add lucide-react
```

Con **PowerShell** (si `./frontend/pnpm.sh` no funciona):

```powershell
bash frontend/pnpm.sh add lucide-react
```

---

## Linux

### 1. Instalar Docker

En Fedora / Ubuntu y similares, instala Docker Engine o Docker Desktop según prefieras.

Si usas Docker Engine, asegúrate de que tu usuario esté en el grupo `docker`:

```bash
sudo usermod -aG docker $USER
```

Cierra sesión y vuelve a entrar para que tome efecto.

### 2. Encender Docker (hacerlo siempre antes de trabajar)

**Con Docker Desktop:** ábrelo y espera a que esté running.

**Con Docker Engine (servicio del sistema):**

```bash
sudo systemctl start docker
```

Para que arranque solo al encender el PC:

```bash
sudo systemctl enable docker
```

### 3. Abrir terminal en el proyecto

```bash
cd ~/Escritorio/workspace/mia-system
```

> Usa la ruta real donde tengas clonado el repo.

### 4. Comprobar que Docker responde

```bash
docker ps
```

- Si ves una tabla (aunque esté vacía) → Docker está OK.
- Si sale *permission denied* → tu usuario no tiene acceso a Docker (revisa el grupo `docker`).
- Si sale *Cannot connect* → el servicio no está corriendo (`sudo systemctl start docker`).

### 5. Instalar paquetes npm en el frontend (Linux)

```bash
./frontend/pnpm.sh add lucide-react
./frontend/pnpm.sh add -D alguna-dev-dep
./frontend/pnpm.sh install
```

---

## Comandos globales

Estos comandos son **iguales en Windows y Linux**. Ejecútalos siempre desde la carpeta `mia-system/`.

### Levantar el proyecto

Primera vez o después de cambiar Dockerfiles / dependencias:

```bash
docker compose up --build
```

- Verás logs en la terminal.
- Para cerrar: `Ctrl + C`.

En segundo plano (la terminal queda libre):

```bash
docker compose up --build -d
```

### Detener el proyecto

```bash
docker compose down
```

Resetear también volúmenes de Docker (`node_modules`, `.next`, `dist` del contenedor):

```bash
docker compose down -v
```

> Usa `-v` solo si quieres empezar cache/dependencias del contenedor de cero.

### Ver estado y logs

```bash
docker compose ps
docker compose logs -f
docker compose logs -f api
docker compose logs -f frontend
```

### Reiniciar un servicio

```bash
docker compose restart frontend
docker compose restart api
```

---

## URLs (cuando el proyecto está levantado)

| Qué | Dónde abrirlo |
|-----|----------------|
| API (Nest) | http://localhost:3000 |
| Frontend (Next) | http://localhost:3001 |

---

## Frontend

Stack y convenciones del frontend (`frontend/`).

### Tailwind CSS

Estilos con **Tailwind CSS v4** (`tailwindcss` + `@tailwindcss/postcss`).

- Config global de estilos: `frontend/src/app/globals.css`
- Clases en JSX/TSX con `className`, por ejemplo: `className="bg-gray-100 text-black"`

### Iconos (Lucide)

Iconos con **Lucide React** (`lucide-react` ^1.21.0).

```jsx
import { Camera, Home, User } from 'lucide-react';

<Camera className="size-6" />
```

Si agregás iconos o librerías nuevas, instalalas con:

```bash
./frontend/pnpm.sh add lucide-react
```

### Pages y components (espejo)

Los **components son espejo de las pages**: misma ruta de carpetas, distinto rol.

| Page (ruta URL) | Carpeta de page | Carpeta de components |
|-----------------|-----------------|------------------------|
| `/login` | `src/app/login/` | `src/app/components/login/` |
| `/app` | `src/app/app/` | `src/app/components/app/` |
| `/app/ejemploPage` | `src/app/app/ejemploPage/` | `src/app/components/app/ejemploPage/` |

Regla:

- **`src/app/.../page.jsx`** → define la página (ruta en Next.js).
- **`src/app/components/.../`** → componentes reutilizables de esa página, **misma estructura de carpetas**.

Ejemplo:

```
src/app/
├── app/
│   ├── page.jsx                    → http://localhost:3001/app
│   └── ejemploPage/
│       └── page.jsx                → http://localhost:3001/app/ejemploPage
└── components/
    ├── app/
    │   ├── MiComponente.jsx        → usado por /app
    │   └── ejemploPage/
    │       └── OtroComponente.jsx  → usado por /app/ejemploPage
    └── EjemploComponent.jsx
```

La page importa sus components desde la carpeta espejo correspondiente.

---

## Estructura del repo

```
mia-system/
├── docker-compose.yml   ← orquesta backend + frontend
├── README.md
├── backend/             ← NestJS
└── frontend/            ← Next.js (Tailwind v4 + Lucide)
    ├── pnpm.sh          ← instalar paquetes sin pnpm local
    └── src/app/
        ├── .../page.jsx           ← pages (rutas)
        └── components/...         ← espejo de las pages
```

---

## Problemas frecuentes

### "Cannot connect to the Docker daemon" / Docker no responde

Docker no está encendido. Vuelve a la sección **Windows** o **Linux** y enciende Docker antes de seguir.

### No puedo guardar archivos en el editor (solo Linux)

A veces Docker deja archivos como `root`. Con el proyecto **parado** (`docker compose down`):

```bash
docker run --rm -v "$PWD:/project" alpine:3.22 chown -R $(id -u):$(id -g) /project
```

### El hot reload no funciona en Windows (pero en Linux sí)

**Por qué:** Docker en Windows no avisa bien al contenedor cuando guardás un archivo. Además, Next.js 16 usa **Turbopack** por defecto, y Turbopack **no detecta cambios** dentro de Docker en Windows.

**Qué hicimos en el proyecto:** el frontend arranca con `next dev --webpack` y polling activado (`WATCHPACK_POLLING`, `CHOKIDAR_USEPOLLING`).

Tu colega debe **bajar y volver a levantar** después de actualizar el repo:

```bash
docker compose down
docker compose up --build
```

**Recomendaciones extra para Windows:**

1. Clonar el repo **dentro de WSL** (ej. `\\wsl$\Ubuntu\home\...`), no en `C:\Users\...`.
2. Abrir el proyecto desde **WSL** en VS Code / Cursor (`code .` desde bash de WSL).
3. Si aún falla, refrescar la página una vez tras el primer arranque.

### Cambié dependencias y el contenedor no las ve

```bash
docker compose down
docker compose up --build
```
