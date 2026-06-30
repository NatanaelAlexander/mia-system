-- Refactor: legal_representatives como persona; company_representatives N:M empresa ↔ representante

DROP TABLE IF EXISTS legal_representatives CASCADE;
DROP TABLE IF EXISTS company_representatives CASCADE;

CREATE TABLE IF NOT EXISTS legal_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  identification_number VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_representatives (
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  legal_representative_id UUID NOT NULL REFERENCES legal_representatives (id) ON DELETE CASCADE,
  position VARCHAR(100),
  PRIMARY KEY (company_id, legal_representative_id)
);

CREATE INDEX IF NOT EXISTS idx_legal_representatives_identification
  ON legal_representatives (identification_number);

CREATE INDEX IF NOT EXISTS idx_company_representatives_legal_rep
  ON company_representatives (legal_representative_id);
