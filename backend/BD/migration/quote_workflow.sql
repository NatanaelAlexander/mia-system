-- Feature: quote statuses (multi) + signed document asset

CREATE TABLE IF NOT EXISTS quote_status_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'general'
    CHECK (category IN ('workflow', 'payment', 'exchange', 'general')),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes_statuses (
  quote_id UUID NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
  status_id UUID NOT NULL REFERENCES quote_status_catalog (id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users (id) ON DELETE SET NULL,
  PRIMARY KEY (quote_id, status_id)
);

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS signed_asset_id UUID REFERENCES assets (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_quotes_signed_asset_id
  ON quotes (signed_asset_id)
  WHERE signed_asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_statuses_status_id ON quotes_statuses (status_id);
CREATE INDEX IF NOT EXISTS idx_quotes_signed_asset_id ON quotes (signed_asset_id);

INSERT INTO quote_status_catalog (code, name, category, sort_order) VALUES
  ('enviado', 'Enviado', 'workflow', 10),
  ('revisado_cliente', 'Revisado por el cliente', 'workflow', 20),
  ('pendiente_pago', 'Pendiente de pago', 'payment', 30),
  ('pagado', 'Pagado', 'payment', 40),
  ('no_pagado', 'No pagado', 'payment', 50),
  ('canje', 'Canje', 'exchange', 60),
  ('no_canje', 'No canje', 'exchange', 70)
ON CONFLICT (code) DO NOTHING;
