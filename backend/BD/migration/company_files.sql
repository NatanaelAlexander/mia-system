-- Feature: company_files (drive de empresa: carpetas + assets)

CREATE TABLE IF NOT EXISTS company_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  parent_id UUID REFERENCES company_folders (id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_by_id UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_company_folders_sibling_name
  ON company_folders (
    company_id,
    (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)),
    name
  );

CREATE INDEX IF NOT EXISTS idx_company_folders_company_parent
  ON company_folders (company_id, parent_id);

CREATE TABLE IF NOT EXISTS company_folder_assets (
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  folder_id UUID REFERENCES company_folders (id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (asset_id)
);

CREATE INDEX IF NOT EXISTS idx_company_folder_assets_folder
  ON company_folder_assets (company_id, folder_id);
