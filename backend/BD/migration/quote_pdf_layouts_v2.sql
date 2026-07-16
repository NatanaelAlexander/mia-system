-- Feature: replace compacto layout with informe / banner / dual

UPDATE quotes
SET pdf_layout_id = 'clasico'
WHERE pdf_layout_id = 'compacto';

ALTER TABLE quotes
  DROP CONSTRAINT IF EXISTS quotes_pdf_layout_id_chk;

ALTER TABLE quotes
  ADD CONSTRAINT quotes_pdf_layout_id_chk
  CHECK (
    pdf_layout_id IN (
      'clasico',
      'tarjetas',
      'minimal',
      'editorial',
      'informe',
      'banner',
      'dual'
    )
  );
