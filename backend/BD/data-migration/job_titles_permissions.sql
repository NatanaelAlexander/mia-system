-- Permisos CRUD de cargos laborales (para instalaciones ya migradas)

INSERT INTO permissions (name, module) VALUES
  ('job_titles:read', 'job_titles'),
  ('job_titles:create', 'job_titles'),
  ('job_titles:update', 'job_titles'),
  ('job_titles:delete', 'job_titles')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name LIKE 'job_titles:%'
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;
