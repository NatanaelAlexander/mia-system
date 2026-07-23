/**
 * Catálogo de artículos de ayuda.
 * Para agregar uno nuevo: registra la categoría (si aplica) y el artículo aquí.
 *
 * audience:
 * - "internal" → solo equipo (admin / superadmin)
 * - "portal"   → solo clientes
 * - "both"     → ambos
 */

export type HelpAudience = "internal" | "portal" | "both";

export type HelpCategoryId =
  | "general"
  | "specs"
  | "workflow"
  | "commands"
  | "database"
  | "docker";

export type HelpCommandBlock = {
  label?: string;
  /** Comando igual en Windows y Linux */
  universal?: string;
  windows?: string;
  linux?: string;
  note?: string;
};

export type HelpSection = {
  title?: string;
  paragraphs?: string[];
  bullets?: string[];
  commands?: HelpCommandBlock[];
  table?: {
    headers: [string, string];
    rows: [string, string][];
  };
};

export type HelpArticle = {
  id: string;
  categoryId: HelpCategoryId;
  title: string;
  description?: string;
  audience: HelpAudience;
  sections: HelpSection[];
};

export type HelpCategory = {
  id: HelpCategoryId;
  label: string;
};

export const HELP_CATEGORIES = [
  { id: "general", label: "Ayuda general" },
  { id: "specs", label: "Especificaciones" },
  { id: "workflow", label: "Flujo de trabajo" },
  { id: "commands", label: "Comandos" },
  { id: "database", label: "Base de datos" },
  { id: "docker", label: "Docker" },
] as const satisfies readonly HelpCategory[];

export const HELP_ARTICLES = [
  // ── Portal (cliente) ──────────────────────────────────────────────
  {
    id: "portal-intro",
    categoryId: "general",
    title: "Bienvenida al portal",
    description: "Qué puedes hacer como cliente en MIA System.",
    audience: "portal",
    sections: [
      {
        paragraphs: [
          "Este portal te permite seguir el trabajo de tus proyectos y comunicarte con el equipo de soporte o desarrollo.",
          "Solo ves la información de las empresas a las que estás vinculado: empresas, proyectos y tickets relacionados.",
        ],
        bullets: [
          "Dashboard: resumen de tus empresas y tickets",
          "Empresas: datos y proyectos de tu organización",
          "Tickets: crear solicitudes, seguir el estado y conversar con el equipo",
          "Notificaciones: avisos cuando hay actividad en tus tickets",
        ],
      },
    ],
  },
  {
    id: "portal-navigation",
    categoryId: "general",
    title: "Cómo moverte por el sistema",
    description: "Menú, dashboard y secciones principales.",
    audience: "portal",
    sections: [
      {
        paragraphs: [
          "Usa el menú de la izquierda para ir al Dashboard o a Empresas. Desde una empresa puedes abrir sus proyectos y, desde ahí, los tickets.",
        ],
        bullets: [
          "Dashboard: números clave y evolución de tus tickets",
          "Empresas: listado de las empresas asociadas a tu usuario",
          "Campana de notificaciones (arriba a la derecha): avisos recientes",
          "Ayuda (?): esta guía, siempre disponible",
        ],
      },
    ],
  },
  {
    id: "portal-companies-projects",
    categoryId: "workflow",
    title: "Empresas y proyectos",
    description: "Cómo revisar tu organización y sus proyectos.",
    audience: "portal",
    sections: [
      {
        paragraphs: [
          "Todo el trabajo se organiza así: Empresa → Proyecto → Ticket. Un ticket siempre pertenece a un proyecto.",
        ],
        bullets: [
          "En Empresas verás solo las que tienes asignadas",
          "Al abrir una empresa puedes revisar sus datos y la pestaña de Proyectos",
          "Cada proyecto concentra los tickets y archivos de ese trabajo",
          "No puedes crear empresas ni proyectos: eso lo gestiona el equipo interno",
        ],
      },
    ],
  },
  {
    id: "portal-tickets",
    categoryId: "workflow",
    title: "Tickets: crear y seguir",
    description: "Abrir una solicitud y ver su avance.",
    audience: "portal",
    sections: [
      {
        paragraphs: [
          "Los tickets son el canal para pedir soporte, reportar un problema o solicitar un cambio dentro de un proyecto.",
        ],
        bullets: [
          "Crea un ticket desde el proyecto correspondiente (título, descripción y prioridad)",
          "Sigue el estado en el tablero o en el detalle del ticket",
          "Los estados avanzan cuando el equipo trabaja tu solicitud (por ejemplo: tomado, en desarrollo, esperando cliente, terminado)",
          "Si el equipo te pide información, el ticket puede quedar en «Esperando cliente»",
        ],
      },
    ],
  },
  {
    id: "portal-chat-files",
    categoryId: "workflow",
    title: "Conversación y archivos",
    description: "Chatear en el ticket y adjuntar documentos.",
    audience: "portal",
    sections: [
      {
        paragraphs: [
          "Dentro de cada ticket tienes un chat para hablar con el equipo y adjuntar archivos que ayuden a resolver la solicitud.",
        ],
        bullets: [
          "Escribe mensajes en el chat del ticket; el equipo los ve en tiempo real",
          "Puedes subir archivos al mensaje o al ticket (capturas, documentos, etc.)",
          "Solo ves la conversación pública: los notas internas del equipo no aparecen en tu portal",
          "Revisa las notificaciones para enterarte de respuestas nuevas",
        ],
      },
    ],
  },
  // ── Interno (equipo) ──────────────────────────────────────────────
  {
    id: "intro",
    categoryId: "general",
    title: "Introducción",
    description: "Qué es MIA System y cómo está organizado.",
    audience: "internal",
    sections: [
      {
        paragraphs: [
          "MIA System es una plataforma de gestión de clientes, proyectos y tickets para equipos de desarrollo de software.",
          "El stack principal es NestJS (API), Next.js (frontend) y PostgreSQL. Todo el entorno de desarrollo corre con Docker.",
        ],
        bullets: [
          "Documentación en el repo: docs/REQUERIMIENTOS.md y docs/ARQUITECTURA-BACKEND.md",
          "Migraciones SQL: backend/BD/migration/ y backend/BD/data-migration/",
          "Variables de entorno: copiar .env.example → .env en la raíz del proyecto",
        ],
      },
    ],
  },
  {
    id: "urls",
    categoryId: "general",
    title: "URLs y acceso",
    audience: "internal",
    sections: [
      {
        table: {
          headers: ["Servicio", "URL"],
          rows: [
            ["Frontend", "http://localhost:3001"],
            ["API REST", "http://localhost:3000/api"],
            ["Health check", "http://localhost:3000/"],
            ["Scalar (API docs)", "http://localhost:3000/api/reference"],
            ["Postgres (local)", "localhost:5432"],
          ],
        },
      },
      {
        title: "Usuarios de desarrollo",
        paragraphs: ["Tras ejecutar migrate:data:"],
        table: {
          headers: ["Email", "Contraseña / Rol"],
          rows: [
            ["admin@mia.local", "admin — administrador"],
            ["cliente@mia.local", "cliente — portal cliente"],
          ],
        },
      },
    ],
  },
  {
    id: "system-overview",
    categoryId: "specs",
    title: "Descripción del sistema",
    audience: "internal",
    sections: [
      {
        paragraphs: [
          "No es solo un sistema de tickets: unifica empresas, usuarios, proyectos, archivos y soporte en una sola plataforma modular.",
        ],
        bullets: [
          "Base de datos normalizada en PostgreSQL",
          "Usuarios internos (equipo) y externos (clientes por empresa)",
          "RBAC: roles definen permisos; cargos (job titles) son informativos",
          "Eliminación lógica: usuarios y empresas no se borran físicamente",
          "Tickets en estado Borrador quedan ocultos en listados y portal",
        ],
      },
    ],
  },
  {
    id: "api-surfaces",
    categoryId: "specs",
    title: "API y superficies",
    audience: "internal",
    sections: [
      {
        table: {
          headers: ["Superficie", "Uso"],
          rows: [
            ["/api/internal/*", "Equipo interno (admin, super_admin, etc.)"],
            ["/api/portal/*", "Clientes vinculados a su empresa"],
            ["POST /api/auth/login", "Inicio de sesión"],
            ["POST /api/auth/refresh", "Renovar access token"],
          ],
        },
        bullets: [
          "Prefijo global: /api",
          "Autenticación: header Authorization: Bearer <accessToken>",
          "Errores en español: { statusCode, mensaje }",
          "Varios GET con filtros reciben datos por body, no por query string",
        ],
      },
    ],
  },
  {
    id: "domain-flow",
    categoryId: "workflow",
    title: "Empresas → Proyectos → Tickets",
    audience: "internal",
    sections: [
      {
        paragraphs: [
          "La jerarquía operativa es: Empresa → Proyecto → Ticket. Todo ticket pertenece a un proyecto, no directamente a una empresa.",
        ],
        bullets: [
          "Empresas: datos, representantes legales y usuarios cliente vinculados",
          "Proyectos: activos vinculados a una empresa",
          "Tickets: soporte y desarrollo dentro de un proyecto",
          "Assets: archivos en R2 referenciados desde proyectos, tickets o comentarios",
          "Asignación: solo superadmin asigna; admin solo ve tickets donde está asignado",
        ],
      },
    ],
  },
  {
    id: "backend-request",
    categoryId: "workflow",
    title: "Flujo de una request (backend)",
    audience: "internal",
    sections: [
      {
        paragraphs: [
          "Cliente HTTP → main.ts (ValidationPipe + AppExceptionFilter) → Controller → Service → queries SQL parametrizadas → PostgreSQL.",
        ],
        bullets: [
          "Controller: rutas y DTOs; no contiene reglas de negocio",
          "Service: lógica y excepciones de dominio",
          "queries/: SQL fijo con $1, $2… sin concatenar input del usuario",
          "Sin ORM: pg directo con DatabaseService",
        ],
      },
    ],
  },
  {
    id: "setup-windows",
    categoryId: "commands",
    title: "Setup — Windows",
    audience: "internal",
    sections: [
      {
        paragraphs: [
          "Instalar Docker Desktop con WSL2. Abrir Docker Desktop y esperar Engine running antes de trabajar.",
        ],
        commands: [
          {
            label: "Ir al proyecto",
            windows: "cd C:\\ruta\\al\\mia-system",
          },
          {
            label: "Comprobar Docker",
            universal: "docker ps",
          },
          {
            label: "Variables de entorno (primera vez)",
            universal: "cp .env.example .env",
          },
          {
            label: "Instalar paquetes frontend (si pnpm.sh falla en PowerShell)",
            windows: "bash frontend/pnpm.sh add <paquete>",
          },
        ],
      },
    ],
  },
  {
    id: "setup-linux",
    categoryId: "commands",
    title: "Setup — Linux",
    audience: "internal",
    sections: [
      {
        paragraphs: [
          "Instalar Docker Engine o Docker Desktop. Si hay permission denied, agregar tu usuario al grupo docker y reiniciar sesión.",
        ],
        commands: [
          {
            label: "Iniciar Docker",
            linux: "sudo systemctl start docker",
          },
          {
            label: "Agregar usuario al grupo docker",
            linux: "sudo usermod -aG docker $USER",
          },
          {
            label: "Ir al proyecto",
            linux: "cd ~/ruta/al/mia-system",
          },
          {
            label: "Comprobar Docker",
            universal: "docker ps",
          },
          {
            label: "Variables de entorno (primera vez)",
            universal: "cp .env.example .env",
          },
        ],
      },
    ],
  },
  {
    id: "daily-commands",
    categoryId: "commands",
    title: "Comandos del día a día",
    audience: "internal",
    sections: [
      {
        commands: [
          { label: "Levantar stack", universal: "docker compose up --build" },
          { label: "Detener", universal: "docker compose down" },
          { label: "Estado", universal: "docker compose ps" },
          { label: "Logs (todos)", universal: "docker compose logs -f" },
          { label: "Logs API", universal: "docker compose logs -f api" },
          { label: "Reiniciar API", universal: "docker compose restart api" },
          {
            label: "Instalar deps API",
            universal: "docker compose exec api pnpm install",
          },
          {
            label: "Paquetes frontend",
            universal: "./frontend/pnpm.sh add <paquete>",
          },
        ],
      },
    ],
  },
  {
    id: "schema-migrate",
    categoryId: "database",
    title: "Migración de esquema",
    audience: "internal",
    sections: [
      {
        paragraphs: [
          "docker compose up --build no ejecuta migraciones automáticamente. Con el stack arriba, en otra terminal:",
        ],
        commands: [
          {
            label: "Crear tablas",
            universal: "docker compose exec api pnpm run migrate",
          },
        ],
        bullets: [
          "Scripts en backend/BD/migration/*.sql",
          "Orden definido en backend/BD/run-migrations.ts",
          "Repetir si hiciste docker compose down -v o cambiaste los .sql",
        ],
      },
    ],
  },
  {
    id: "data-migrate",
    categoryId: "database",
    title: "Migración de datos",
    audience: "internal",
    sections: [
      {
        paragraphs: [
          "Inserta catálogos iniciales, roles, estados y usuarios de desarrollo.",
        ],
        commands: [
          {
            label: "Datos iniciales",
            universal: "docker compose exec api pnpm run migrate:data",
          },
          {
            label: "Consola Postgres",
            universal:
              "docker compose exec bd_main psql -U mia_user -d mia_system",
            note: "Ajusta usuario y DB si cambiaste .env",
          },
        ],
        bullets: [
          "Scripts en backend/BD/data-migration/",
          "Los datos de desarrollo viven en el volumen Docker mia_pg_data (no van a Git)",
        ],
      },
    ],
  },
  {
    id: "db-persistence",
    categoryId: "database",
    title: "Persistencia y reset",
    audience: "internal",
    sections: [
      {
        table: {
          headers: ["Acción", "¿Se conservan los datos?"],
          rows: [
            ["docker compose down", "Sí"],
            ["Ctrl+C y volver a up", "Sí"],
            ["git push", "No aplica (Git no ve el volumen)"],
            ["docker compose down -v", "No — reset total"],
          ],
        },
        paragraphs: [
          "Desde el contenedor api, DATABASE_URL usa el host bd_main, no localhost.",
        ],
        commands: [
          {
            label: "Ejemplo DATABASE_URL (dentro de Docker)",
            universal:
              "postgresql://POSTGRES_USER:POSTGRES_PASSWORD@bd_main:5432/POSTGRES_DB",
          },
        ],
      },
    ],
  },
  {
    id: "docker-up",
    categoryId: "docker",
    title: "Levantar el proyecto",
    audience: "internal",
    sections: [
      {
        paragraphs: [
          "Siempre ejecutar docker compose down antes de un nuevo up --build para liberar puertos y evitar conflictos.",
        ],
        commands: [
          { label: "1. Bajar contenedores previos", universal: "docker compose down" },
          { label: "2. Levantar todo", universal: "docker compose up --build" },
          { label: "3. Migrar esquema", universal: "docker compose exec api pnpm run migrate" },
          { label: "4. Migrar datos", universal: "docker compose exec api pnpm run migrate:data" },
        ],
        bullets: [
          "Servicios: bd_main (Postgres), redis, api (Nest), frontend (Next)",
          "Si cambiaste package.json o Dockerfiles: down + up --build de nuevo",
        ],
      },
    ],
  },
  {
    id: "docker-troubleshoot",
    categoryId: "docker",
    title: "Problemas frecuentes",
    audience: "internal",
    sections: [
      {
        table: {
          headers: ["Problema", "Solución"],
          rows: [
            ["Docker no responde (Windows)", "Abrir Docker Desktop → Engine running"],
            ["Docker no responde (Linux)", "sudo systemctl start docker"],
            ["API no compila / módulo no encontrado", "docker compose exec api pnpm install && restart api"],
            ["Scalar 404", "Verificar que api compiló; URL: /api/reference"],
            ["Error SASL / password Postgres", "Revisar .env y que DATABASE_URL coincida con POSTGRES_*"],
            ["Hot reload (Windows)", "Clonar proyecto dentro de WSL"],
            ["Permisos archivos (Linux)", "docker run --rm -v \"$PWD:/project\" alpine chown -R $(id -u):$(id -g) /project"],
          ],
        },
      },
    ],
  },
] as const satisfies readonly HelpArticle[];

const articleMap = new Map<string, HelpArticle>(
  HELP_ARTICLES.map((article) => [article.id, article]),
);

export function articleMatchesAudience(
  article: HelpArticle,
  audience: Exclude<HelpAudience, "both">,
): boolean {
  return article.audience === "both" || article.audience === audience;
}

export function getHelpArticle(id: string): HelpArticle | undefined {
  return articleMap.get(id);
}

export function getHelpArticlesByCategory(
  categoryId: HelpCategoryId,
  audience?: Exclude<HelpAudience, "both">,
): HelpArticle[] {
  return HELP_ARTICLES.filter((article) => {
    if (article.categoryId !== categoryId) {
      return false;
    }
    if (!audience) {
      return true;
    }
    return articleMatchesAudience(article, audience);
  });
}

export function getHelpCategoriesForAudience(
  audience: Exclude<HelpAudience, "both">,
): HelpCategory[] {
  return HELP_CATEGORIES.filter(
    (category) => getHelpArticlesByCategory(category.id, audience).length > 0,
  );
}

export function getHelpCategory(
  id: HelpCategoryId,
): HelpCategory | undefined {
  return HELP_CATEGORIES.find((category) => category.id === id);
}
