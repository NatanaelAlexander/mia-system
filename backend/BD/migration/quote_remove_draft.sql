-- Feature: quote_remove_draft
-- Elimina el ciclo interno «draft» / Borrador de cotizaciones (idempotente)

UPDATE quotes
SET status = 'ready'
WHERE status = 'draft';

ALTER TABLE quotes
  ALTER COLUMN status SET DEFAULT 'ready';

-- Quita cualquier check antiguo de status (incluye el que permitía draft).
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'quotes'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
      AND (
        pg_get_constraintdef(con.oid) ILIKE '%draft%'
        OR con.conname IN ('quotes_status_check', 'quotes_status_lifecycle_chk')
      )
  LOOP
    EXECUTE format('ALTER TABLE quotes DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE quotes
  DROP CONSTRAINT IF EXISTS quotes_status_lifecycle_chk;

ALTER TABLE quotes
  ADD CONSTRAINT quotes_status_lifecycle_chk
  CHECK (status IN ('ready', 'sent'));
