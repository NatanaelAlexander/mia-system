-- Feature: PDF style template on quotes

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS pdf_style_id VARCHAR(32) NOT NULL DEFAULT 'clasico';

ALTER TABLE quotes
  DROP CONSTRAINT IF EXISTS quotes_pdf_style_id_chk;

ALTER TABLE quotes
  ADD CONSTRAINT quotes_pdf_style_id_chk
  CHECK (
    pdf_style_id IN (
      'clasico',
      'corporativo',
      'bosque',
      'medianoche',
      'coral'
    )
  );
