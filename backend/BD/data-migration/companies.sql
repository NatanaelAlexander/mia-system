-- Data: empresa demo y vínculo del usuario cliente

INSERT INTO companies (name, tax_id, email, status)
VALUES (
  'Empresa Demo',
  '76123456-7',
  'contacto@empresademo.cl',
  'active'
)
ON CONFLICT (tax_id) DO NOTHING;

INSERT INTO users_companies (user_id, company_id)
SELECT u.id, c.id
FROM users u
JOIN companies c ON c.tax_id = '76123456-7'
WHERE u.email = 'cliente@mia.local'
ON CONFLICT DO NOTHING;
