-- Data: roles y asignación de permisos (lógica inspirada en edificio-alcazar)

INSERT INTO roles (name) VALUES
  ('super_admin'),
  ('admin'),
  ('cliente')
ON CONFLICT (name) DO NOTHING;

-- super_admin → todo menos auditoría
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.name = 'super_admin'
  AND p.name NOT LIKE 'audit_logs:%'
ON CONFLICT DO NOTHING;

-- admin → operación general sin system, roles, permissions ni CRUD de usuarios (solo read)
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.name = 'admin'
  AND p.name NOT LIKE 'audit_logs:%'
  AND p.name != 'system:manage'
  AND p.name NOT LIKE 'roles:%'
  AND p.name NOT LIKE 'permissions:%'
  AND (
    p.name NOT LIKE 'users:%'
    OR p.name = 'users:read'
  )
ON CONFLICT DO NOTHING;

-- cliente → portal externo: lectura y tickets propios de su empresa (reglas finas en API)
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  'companies:read',
  'projects:read',
  'assets:read',
  'assets:create',
  'tickets:read',
  'tickets:create',
  'tickets:update',
  'tickets:delete',
  'ticket_comments:read',
  'ticket_comments:create'
)
WHERE r.name = 'cliente'
ON CONFLICT DO NOTHING;
