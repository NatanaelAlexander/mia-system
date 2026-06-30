/** Módulos alineados con `permissions.module` en BD (prefijo de `module:action`). */
export type PermissionModule =
  | 'users'
  | 'roles'
  | 'permissions'
  | 'companies'
  | 'projects'
  | 'assets'
  | 'tickets'
  | 'ticket_comments'
  | 'audit_logs'
  | 'system';
