-- Data: empresa demo y vínculo del usuario cliente
-- tax_id siempre en formato canónico: 12.345.678-5

INSERT INTO companies (name, tax_id, email, status)
VALUES (
  'Empresa Demo',
  '12.345.678-5',
  'contacto@empresademo.cl',
  'active'
)
ON CONFLICT (tax_id) DO NOTHING;

-- Corrige RUT demo inválido (cualquier variante sin puntos)
UPDATE companies
SET tax_id = '12.345.678-5'
WHERE regexp_replace(tax_id, '[.\-]', '', 'g') = '761234567';

INSERT INTO users_companies (user_id, company_id)
SELECT u.id, c.id
FROM users u
JOIN companies c ON regexp_replace(c.tax_id, '[.\-]', '', 'g') = '123456785'
WHERE u.email = 'cliente@mia.local'
ON CONFLICT DO NOTHING;
