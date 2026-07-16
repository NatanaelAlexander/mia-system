-- Feature: quotes (cotizaciones)

CREATE TABLE IF NOT EXISTS quote_issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) NOT NULL,
  service_description VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS quotes_number_seq START 1;

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number INTEGER NOT NULL DEFAULT nextval('quotes_number_seq'),
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  legal_representative_id UUID NOT NULL REFERENCES legal_representatives (id) ON DELETE RESTRICT,
  issuer_id UUID NOT NULL REFERENCES quote_issuers (id) ON DELETE RESTRICT,
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('company', 'project', 'ticket')),
  project_id UUID REFERENCES projects (id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES tickets (id) ON DELETE SET NULL,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('boleta', 'factura')),
  client_visible BOOLEAN NOT NULL DEFAULT FALSE,
  issue_date DATE NOT NULL,
  expires_at DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'sent')),
  created_by UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT quotes_scope_company_chk CHECK (
    scope != 'company'
    OR (project_id IS NULL AND ticket_id IS NULL)
  ),
  CONSTRAINT quotes_scope_project_chk CHECK (
    scope != 'project'
    OR (project_id IS NOT NULL AND ticket_id IS NULL)
  ),
  CONSTRAINT quotes_scope_ticket_chk CHECK (
    scope != 'ticket'
    OR (project_id IS NOT NULL AND ticket_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS quote_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('unico', 'mensual', 'anual')),
  es_canje BOOLEAN NOT NULL DEFAULT FALSE,
  apply_tax BOOLEAN NOT NULL DEFAULT FALSE,
  price_input_mode VARCHAR(20) NOT NULL DEFAULT 'gross'
    CHECK (price_input_mode IN ('gross', 'liquid')),
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  retention_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  liquid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (quote_id, frequency)
);

CREATE TABLE IF NOT EXISTS quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES quote_sections (id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(14, 2) NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quote_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL UNIQUE REFERENCES quotes (id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL CHECK (type IN ('quote_sent')),
  message TEXT NOT NULL,
  share_token VARCHAR(64),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes (company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes (project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_ticket_id ON quotes (ticket_id);
CREATE INDEX IF NOT EXISTS idx_quotes_issuer_id ON quotes (issuer_id);
CREATE INDEX IF NOT EXISTS idx_quote_sections_quote_id ON quote_sections (quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_section_id ON quote_line_items (section_id);
CREATE INDEX IF NOT EXISTS idx_quote_share_links_token ON quote_share_links (token);
CREATE INDEX IF NOT EXISTS idx_quote_notifications_user_created
  ON quote_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_notifications_user_unread
  ON quote_notifications (user_id)
  WHERE read_at IS NULL;
