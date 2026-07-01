En `src/components` primero creas la carpeta de la página, ejemplo:

- Página `login` → `src/components/login` (componentes espejo)
- Página `app` → `src/components/app`
- Página `app/tickets` → `src/components/app/tickets`

Los componentes descargados de shadcn viven en `src/components/ui` y no se modifican.
Los componentes espejo importan desde `@/components/ui` y componen la UI de cada página.
