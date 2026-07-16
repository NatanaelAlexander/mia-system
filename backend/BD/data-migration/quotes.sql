-- Data: quote issuers (seed inicial)

INSERT INTO quote_issuers (
  full_name,
  tax_id,
  service_description,
  phone_number,
  email,
  is_active
)
SELECT
  'NATANAEL ALEXANDER MUÑOZ JIMÉNEZ',
  '20.621.174-1',
  'DESARROLLO WEB Y ASESORIA',
  '+56933036068',
  'NAMUJI38@GMAIL.COM',
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM quote_issuers WHERE tax_id = '20.621.174-1'
);
