En `src/components` primero creas la carpeta de la página, ejemplo:

- Página `login` → `src/components/login` (componentes espejo)
- Página `app` → `src/components/app/dashboard`
- Página `app/tickets` → `src/components/app/tickets`

Las llamadas al backend de la app viven en `src/components/app/api` (un archivo por recurso).

Los componentes descargados de shadcn viven en `src/components/ui` y no se modifican.
Los componentes espejo importan desde `@/components/ui` y componen la UI de cada página.

El cliente HTTP base (`apiFetch`, auth login/logout) queda en `src/lib/api`.
