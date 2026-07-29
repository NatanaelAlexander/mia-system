# Arquitectura frontend — mia-system

Next.js (App Router) + React + Tailwind. El frontend consume la API Nest (`/api`) y no define backend propio.

---

## Stack

| Pieza | Versión / notas |
|-------|-----------------|
| Next.js | 16 (App Router) |
| React | 19 |
| Tailwind CSS | 4 (`src/app/globals.css`) |
| Iconos | `lucide-react` |
| UI base | `src/components/ui/` (shadcn; no editar a mano de forma habitual) |

Instalar paquetes sin pnpm local:

```bash
./frontend/pnpm.sh add <paquete>
```

(En Windows PowerShell: `bash frontend/pnpm.sh add <paquete>`.)

---

## Estructura

```
frontend/src/
├── app/                    ← rutas (pages delgadas)
│   ├── layout.tsx          ← providers (theme, auth)
│   ├── page.tsx            ← / → redirect login o /app
│   ├── (auth)/login/
│   ├── (app)/app/          ← shell del dashboard
│   └── r/cotizaciones/…    ← revisión pública de cotización
├── components/
│   ├── app/<dominio>/      ← UI por feature (espejo de rutas)
│   ├── app/api/            ← wrappers HTTP por recurso
│   └── ui/                 ← primitivos
├── lib/
│   ├── api/                ← client HTTP (apiFetch, auth)
│   └── auth/               ← cookies JWT, session
└── providers/              ← AuthProvider, realtime, etc.
```

### Convención pages ↔ components

Misma ruta de carpetas: la page solo monta el componente.

| Ruta | Page | UI |
|------|------|-----|
| `/login` | `app/(auth)/login/page.tsx` | `components/…/login` |
| `/app` | `app/(app)/app/page.tsx` | `components/app/…` |
| `/app/tickets` | `app/(app)/app/tickets/…` | `components/app/tickets/…` |

Detalle en `frontend/src/components/info.md`.

---

## Comunicación con la API

- Base: `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`) → requests a `${API}/api/...`
- Cliente: `lib/api/client.ts` (`apiFetch`, upload, detalle)
- Auth: cookies `mia_access` / `mia_refresh`; Bearer en requests autenticados
- Ante `401`: intento de `POST /api/auth/refresh` y reintento
- Dominios: `components/app/api/*.ts` llaman al client
- Tiempo real: Socket.IO al mismo host API con token

---

## Auth y layouts

- **No hay** `middleware.ts` de Next.
- Root `page.tsx`: si hay cookie de access → `/app`, si no → `/login`.
- `AuthProvider`: login/logout, session desde claims del JWT.
- Shell `(app)/app/layout.tsx`: sidebar, breadcrumbs, realtime/notificaciones.
- Permisos en UI vía `useAuth()` + helpers de permisos (la API sigue siendo la fuente de verdad).
- Ruta pública de cotización: `/r/cotizaciones/[quoteId]/[token]`.

---

## Superficies (UI)

| Área | Quién | Rutas típicas |
|------|-------|----------------|
| Internal (app) | Equipo | `/app/*` |
| Portal | Cliente | mismas rutas con menú/permisos acotados |
| Público | Sin sesión app | `/r/cotizaciones/…` |

Contrato HTTP y RBAC del backend: [`ARQUITECTURA-BACKEND.md`](ARQUITECTURA-BACKEND.md).
