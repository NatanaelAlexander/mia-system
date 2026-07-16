-- Feature: PDF layout + colors (separate from presentation style)

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS pdf_layout_id VARCHAR(32) NOT NULL DEFAULT 'clasico';

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS pdf_primary_color VARCHAR(7) NOT NULL DEFAULT '#2563EB';

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS pdf_secondary_color VARCHAR(7) NOT NULL DEFAULT '#6B7280';

ALTER TABLE quotes
  DROP CONSTRAINT IF EXISTS quotes_pdf_layout_id_chk;

ALTER TABLE quotes
  ADD CONSTRAINT quotes_pdf_layout_id_chk
  CHECK (
    pdf_layout_id IN (
      'clasico',
      'compacto',
      'tarjetas',
      'minimal',
      'editorial'
    )
  );

-- Migrate legacy pdf_style_id (color presets) into layout+colors if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quotes'
      AND column_name = 'pdf_style_id'
  ) THEN
    UPDATE quotes
    SET
      pdf_layout_id = 'clasico',
      pdf_primary_color = CASE pdf_style_id
        WHEN 'corporativo' THEN '#E8913A'
        WHEN 'bosque' THEN '#15803D'
        WHEN 'medianoche' THEN '#4338CA'
        WHEN 'coral' THEN '#E11D48'
        ELSE '#2563EB'
      END,
      pdf_secondary_color = CASE pdf_style_id
        WHEN 'corporativo' THEN '#4A7C7A'
        WHEN 'bosque' THEN '#64748B'
        WHEN 'medianoche' THEN '#64748B'
        WHEN 'coral' THEN '#78716C'
        ELSE '#6B7280'
      END;

    ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_pdf_style_id_chk;
    ALTER TABLE quotes DROP COLUMN pdf_style_id;
  END IF;
END $$;
