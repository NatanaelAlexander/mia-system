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
  | 'job_titles'
  | 'audit_logs'
  | 'system'
  | 'quotes'
  | 'contracts'
  | 'company_files';
