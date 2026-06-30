# Requerimientos del sistema

Documento de contexto funcional para desarrollo. Describe la finalidad del sistema, reglas de negocio y responsabilidad de cada módulo/entidad.

---

## 1. Descripción general

**Sistema de gestión de clientes, proyectos y tickets** para una empresa de desarrollo de software.

### Problema que resuelve

La información de clientes, documentos, solicitudes y estados de trabajo está dispersa. El sistema busca **unificar toda la operación** en una única plataforma.

### Qué es (y qué no es)

- No es solo un sistema de tickets.
- Es una **plataforma de gestión** para clientes, proyectos y desarrollo de software.
- Arquitectura **modular**, base de datos **PostgreSQL**.

### Objetivos

| # | Objetivo |
|---|----------|
| 1 | Administración de clientes (empresas) |
| 2 | Administración de usuarios internos y externos |
| 3 | Gestión de proyectos |
| 4 | Gestión de tickets de soporte y desarrollo |
| 5 | Comunicación entre cliente y equipo de desarrollo |
| 6 | Seguimiento completo del ciclo de vida de cada ticket |
| 7 | Administración de archivos asociados a proyectos y tickets |
| 8 | Auditoría de acciones importantes |
| 9 | Escalabilidad para módulos comerciales futuros (cotizaciones, facturación, pagos) |

---

## 2. Filosofía de diseño

- Base de datos **completamente normalizada**.
- Cada tabla con **una única responsabilidad**.
- No mezclar conceptos distintos en una misma entidad.
- **Catálogos** separados de tablas transaccionales (status, priorities, categories, roles, etc.).
- Sistema **escalable** para nuevos módulos sin rehacer el núcleo.

### Restricciones globales

| Regla | Detalle |
|-------|---------|
| Eliminación de usuarios | Nunca física; solo habilitar/deshabilitar (`is_active`) |
| Eliminación de tickets | No física. Se mueve a estado **Borrador** y queda **oculto** en listados y portal cliente |
| Eliminación de empresas | No física; eliminación lógica cuando corresponda |
| Auditoría temporal | `created_at`, `updated_at` en entidades importantes |
| Soft delete | `deleted_at` cuando aplique |
| Integridad | FK en todas las relaciones |
| Catálogos | Campo `sort_order` para orden en la interfaz |

---

## 3. Usuarios y roles

### Tipos de usuario

| Tipo | Descripción |
|------|-------------|
| **Internos** | SuperAdmin, Admin, desarrolladores, diseñadores, QA, etc. |
| **Externos** | Clientes vinculados a una empresa |

Los internos gestionan el sistema global o varias empresas. Los clientes solo ven datos de **su empresa** (`users_companies`).

### RBAC

- Autenticación y autorización por **roles y permisos**.
- Un usuario puede tener **varios roles**.
- Un usuario puede tener **varios cargos** (job titles).
- **Rol** = autorización. **Cargo** = función laboral (no define permisos).

---

## 4. Módulos y tablas

### 4.1 Seguridad

| Tabla | Finalidad |
|-------|-----------|
| `users` | Cualquier persona que ingresa al sistema. Datos personales, email, contraseña, estado activo/inactivo. |
| `roles` | Autorización en el sistema (Admin, Cliente, Supervisor, Soporte…). No es el cargo laboral. |
| `permissions` | Acciones concretas (crear ticket, eliminar ticket, crear proyecto, administrar empresas…). |
| `roles_permissions` | N:M entre roles y permisos. |
| `users_roles` | N:M entre usuarios y roles. |
| `job_titles` | Cargos laborales (Backend Dev, Frontend Dev, PM, QA, DevOps, UI Designer…). |
| `users_job_titles` | N:M entre usuarios y cargos. |

---

### 4.2 Empresas (clientes)

| Tabla | Finalidad |
|-------|-----------|
| `companies` | Cliente: razón social, RUT, contacto, estado. |
| `legal_representatives` | Personas responsables legalmente; no necesariamente usan el sistema. |
| `company_representatives` | Relación empresa ↔ representantes legales (uno o varios). |
| `users_companies` | Usuario ↔ empresa. El cliente solo accede a información de su empresa. |

---

### 4.3 Proyectos

| Tabla | Finalidad |
|-------|-----------|
| `projects` | Proyecto de una empresa: nombre, descripción, estado, fechas. |
| `projects_assets` | Archivos asociados al proyecto. |

**Regla:** Todo ticket pertenece a un **proyecto**, no directamente a una empresa.

---

### 4.4 Archivos (assets)

| Tabla | Finalidad |
|-------|-----------|
| `assets` | Archivo centralizado (PDF, imagen, doc, video, ZIP…). Nombre, ruta, MIME, peso, fecha, usuario que subió. |
| `projects_assets` | N:M proyecto ↔ archivo. |
| `ticket_assets` | N:M ticket ↔ archivo. |
| `ticket_comment_assets` | N:M comentario ↔ archivo. |

Evitar duplicación: un mismo archivo se referencia, no se copia por entidad.

---

### 4.5 Tickets (núcleo operativo)

Solicitudes de trabajo creadas por **clientes o administradores**. Siempre ligadas a un **proyecto**.

| Tabla | Finalidad |
|-------|-----------|
| `tickets` | Ticket: proyecto, número interno, título, descripción, categoría, prioridad, estado, estado de pago, creador, asignado, fecha límite, horas estimadas, auditoría. |
| `ticket_statuses` | Catálogo de estados (nombre, descripción, color, orden, si es cierre). |
| `ticket_priorities` | Catálogo (Baja, Media, Alta, Urgente…). |
| `ticket_categories` | Catálogo (Bug, Nueva funcionalidad, Soporte, Consulta, Mejora…). |
| `payment_statuses` | Catálogo v1: Pendiente de pago, Pagado, Canje. Placeholder hasta módulo comercial completo. |
| `ticket_comments` | Conversación del ticket. Público (cliente) o interno (solo equipo). Sin límite de comentarios. |
| `ticket_status_history` | Historial completo de cambios de estado (línea de tiempo). |
| `ticket_assets` | Adjuntos del ticket. |
| `ticket_comment_assets` | Adjuntos del comentario. |

#### Estados de ticket (ejemplos)

**Borrador** (oculto) → Creado → Tomado → En desarrollo → QA → Esperando cliente → Terminado / Cancelado

#### Borrador — “eliminar” un ticket sin borrarlo de la BD

Cuando un usuario “elimina” un ticket, **no se borra el registro**. En su lugar:

1. El ticket pasa a estado **`Borrador`** (`ticket_statuses`).
2. Deja de mostrarse en listados normales, dashboards y portal del cliente.
3. El registro sigue en la BD (historial, comentarios, adjuntos intactos).
4. Solo roles internos autorizados podrían ver/recuperar borradores si se implementa esa vista.

Así se evita el `DELETE` físico y se mantiene trazabilidad. El cambio a Borrador debe quedar en `ticket_status_history` y `audit_logs`.

#### Flujo esperado

```
Cliente crea ticket → Creado
Admin lo toma → Tomado
Desarrollo → En desarrollo
QA → QA
Cliente revisa → Esperando cliente
Aprobación → Terminado
```

- El admin puede cambiar el estado en cualquier momento (incluso reabrir uno terminado).
- **Todo cambio** queda en `ticket_status_history`.
- `tickets` guarda solo el **estado actual**; el historial guarda el pasado.

#### Historial (ejemplo de línea de tiempo)

| Hora | Estado |
|------|--------|
| 09:00 | Creado |
| 09:15 | Tomado |
| 10:30 | En desarrollo |
| 15:00 | QA |
| 18:00 | Esperando cliente |
| 20:00 | Terminado |

---

### 4.6 Auditoría

| Tabla | Finalidad |
|-------|-----------|
| `audit_logs` | Registro genérico de acciones importantes: creación, actualización, eliminación lógica, asignación, cambio de estado/permisos. Guarda tabla, registro, acción, usuario, JSON anterior/nuevo, fecha. |

---

## 5. Escalabilidad futura (fuera de v1)

Módulos previstos sin romper la arquitectura principal:

- Cotizaciones y aceptación
- Facturación (boletas/facturas)
- Registro de pagos y comprobantes
- Dashboard y métricas
- Gestión de tiempos de desarrollo
- Reportes
- Notificaciones por correo
- Integración con calendarios
- API pública
- Portal del cliente mejorado

`payment_statuses` en v1 es un catálogo simple hasta que exista el módulo comercial completo.

---

## 6. Stack técnico (contexto de implementación)

| Capa | Tecnología |
|------|------------|
| Backend | NestJS |
| Frontend | Next.js |
| Base de datos | PostgreSQL (`bd_main` en Docker) |
| Migraciones | `backend/BD/migration/*.sql` |
| Rutas internas vs cliente | Separación por rol (internos / portal cliente) |

---

## 7. Notas para desarrollo

Este documento es la **fuente de verdad funcional**. El MER y las migraciones SQL deben alinearse con estas reglas. Si el esquema actual no incluye aún un campo o regla (ej. estado **Borrador** en `ticket_statuses`, `sort_order`, número interno de ticket, comentarios público/interno), se considera **pendiente de implementación**, no fuera de alcance.
