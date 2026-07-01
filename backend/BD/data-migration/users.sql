-- Data: usuarios por defecto (solo desarrollo)
-- Login: superadmin@mia.local / superadmin  |  admin@mia.local / admin  |  cliente@mia.local / cliente

INSERT INTO users (email, password, first_name, last_name, is_active)
VALUES
  (
    'superadmin@mia.local',
    crypt('superadmin', gen_salt('bf')),
    'Super',
    'Admin',
    TRUE
  ),
  (
    'admin@mia.local',
    crypt('admin', gen_salt('bf')),
    'Admin',
    'Sistema',
    TRUE
  ),
  (
    'cliente@mia.local',
    crypt('cliente', gen_salt('bf')),
    'Cliente',
    'Demo',
    TRUE
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO users_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'super_admin'
WHERE u.email = 'superadmin@mia.local'
ON CONFLICT DO NOTHING;

INSERT INTO users_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'admin'
WHERE u.email = 'admin@mia.local'
ON CONFLICT DO NOTHING;

INSERT INTO users_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'cliente'
WHERE u.email = 'cliente@mia.local'
ON CONFLICT DO NOTHING;
