-- Feature: companies

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) NOT NULL UNIQUE,
  address TEXT,
  phone_number VARCHAR(50),
  email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE legal_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  position VARCHAR(100),
  identification_number VARCHAR(50) NOT NULL,
  UNIQUE (company_id, user_id)
);

CREATE TABLE company_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  identification_number VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(100)
);

CREATE TABLE users_companies (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, company_id)
);

CREATE INDEX idx_companies_tax_id ON companies (tax_id);
CREATE INDEX idx_legal_representatives_company_id ON legal_representatives (company_id);
CREATE INDEX idx_company_representatives_company_id ON company_representatives (company_id);
CREATE INDEX idx_users_companies_company_id ON users_companies (company_id);
