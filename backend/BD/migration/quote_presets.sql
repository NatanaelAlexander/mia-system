-- Feature: quote presets (plantillas reutilizables)

CREATE TABLE IF NOT EXISTS quote_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_presets_company_id ON quote_presets (company_id);
CREATE INDEX IF NOT EXISTS idx_quote_presets_created_by ON quote_presets (created_by);
