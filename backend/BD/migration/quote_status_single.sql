-- Feature: quote_status_single
-- Un solo estado comercial por cotización; seed "creado"; canje documental desactivado

INSERT INTO quote_status_catalog (code, name, category, sort_order)
VALUES ('creado', 'Creado', 'workflow', 5)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

UPDATE quote_status_catalog
SET is_active = FALSE
WHERE code IN ('canje', 'no_canje');

DELETE FROM quotes_statuses qs
USING quote_status_catalog sc
WHERE qs.status_id = sc.id
  AND sc.code IN ('canje', 'no_canje');

-- Colapsar a un solo estado por cotización (prioridad comercial).
WITH ranked AS (
  SELECT
    qs.quote_id,
    qs.status_id,
    qs.assigned_at,
    qs.assigned_by,
    ROW_NUMBER() OVER (
      PARTITION BY qs.quote_id
      ORDER BY
        CASE sc.code
          WHEN 'pagado' THEN 1
          WHEN 'no_pagado' THEN 2
          WHEN 'pendiente_pago' THEN 3
          WHEN 'revisado_cliente' THEN 4
          WHEN 'enviado' THEN 5
          WHEN 'creado' THEN 6
          ELSE 100
        END,
        qs.assigned_at DESC
    ) AS rn
  FROM quotes_statuses qs
  INNER JOIN quote_status_catalog sc ON sc.id = qs.status_id
)
DELETE FROM quotes_statuses qs
USING ranked r
WHERE qs.quote_id = r.quote_id
  AND qs.status_id = r.status_id
  AND r.rn > 1;

-- Cotizaciones sin estado comercial → Creado
INSERT INTO quotes_statuses (quote_id, status_id, assigned_by)
SELECT q.id, sc.id, q.created_by
FROM quotes q
CROSS JOIN quote_status_catalog sc
WHERE sc.code = 'creado'
  AND NOT EXISTS (
    SELECT 1 FROM quotes_statuses qs WHERE qs.quote_id = q.id
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_quotes_statuses_one_per_quote
  ON quotes_statuses (quote_id);
