-- Representante legal opcional en cotizaciones.
ALTER TABLE quotes
  ALTER COLUMN legal_representative_id DROP NOT NULL;
