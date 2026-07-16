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

-- Solo corrige RUT demo legacy 76.123.456-7 si aún no existe el canónico
UPDATE companies c
SET tax_id = '12.345.678-5'
WHERE regexp_replace(c.tax_id, '[.\-]', '', 'g') = '761234567'
  AND NOT EXISTS (
    SELECT 1
    FROM companies other
    WHERE other.tax_id = '12.345.678-5'
      AND other.id <> c.id
  );

INSERT INTO users_companies (user_id, company_id)
SELECT u.id, c.id
FROM users u
JOIN companies c ON regexp_replace(c.tax_id, '[.\-]', '', 'g') = '123456785'
WHERE u.email = 'cliente@mia.local'
ON CONFLICT DO NOTHING;
