export const ISSUER_COLUMNS = `
  id,
  full_name AS "fullName",
  tax_id AS "taxId",
  service_description AS "serviceDescription",
  phone_number AS "phoneNumber",
  email,
  is_active AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const QUOTE_LIST_COLUMNS = `
  q.id,
  q.quote_number AS "quoteNumber",
  q.company_id AS "companyId",
  c.name AS "companyName",
  q.legal_representative_id AS "legalRepresentativeId",
  q.issuer_id AS "issuerId",
  q.scope,
  q.project_id AS "projectId",
  p.name AS "projectName",
  q.ticket_id AS "ticketId",
  t.title AS "ticketTitle",
  q.document_type AS "documentType",
  q.pdf_layout_id AS "pdfLayoutId",
  q.pdf_primary_color AS "pdfPrimaryColor",
  q.pdf_secondary_color AS "pdfSecondaryColor",
  q.client_visible AS "clientVisible",
  q.issue_date::text AS "issueDate",
  q.expires_at::text AS "expiresAt",
  q.status,
  q.signed_asset_id AS "signedAssetId",
  q.created_by AS "createdBy",
  q.created_at AS "createdAt",
  q.updated_at AS "updatedAt",
  sl.is_enabled AS "shareEnabled",
  sl.expires_at AS "shareExpiresAt"
`;

export const SQL_FIND_ACTIVE_ISSUERS = `
  SELECT ${ISSUER_COLUMNS}
  FROM quote_issuers
  WHERE is_active = TRUE
  ORDER BY full_name ASC
`;

export const SQL_FIND_ISSUER_BY_ID = `
  SELECT ${ISSUER_COLUMNS}
  FROM quote_issuers
  WHERE id = $1
`;

export const SQL_FIND_QUOTES_FILTERED = `
  SELECT ${QUOTE_LIST_COLUMNS}
  FROM quotes q
  LEFT JOIN companies c ON c.id = q.company_id
  LEFT JOIN projects p ON p.id = q.project_id
  LEFT JOIN tickets t ON t.id = q.ticket_id
  LEFT JOIN quote_share_links sl ON sl.quote_id = q.id
  WHERE ($1::uuid IS NULL OR q.company_id = $1)
    AND ($2::uuid IS NULL OR q.project_id = $2)
    AND ($3::uuid IS NULL OR q.ticket_id = $3)
    AND ($4::text IS NULL OR q.status = $4)
    AND ($5::text IS NULL OR q.document_type = $5)
    AND ($6::boolean IS NULL OR q.client_visible = $6)
    AND (
      $7::text IS NULL
      OR EXISTS (
        SELECT 1
        FROM quotes_statuses qs
        JOIN quote_status_catalog sc ON sc.id = qs.status_id
        WHERE qs.quote_id = q.id
          AND sc.code = $7
      )
    )
    AND ($8::date IS NULL OR q.issue_date >= $8::date)
    AND ($9::date IS NULL OR q.issue_date <= $9::date)
  ORDER BY q.issue_date DESC, q.created_at DESC
`;

export const SQL_FIND_QUOTE_BY_ID = `
  SELECT ${QUOTE_LIST_COLUMNS}
  FROM quotes q
  LEFT JOIN companies c ON c.id = q.company_id
  LEFT JOIN projects p ON p.id = q.project_id
  LEFT JOIN tickets t ON t.id = q.ticket_id
  LEFT JOIN quote_share_links sl ON sl.quote_id = q.id
  WHERE q.id = $1
`;

export const SQL_INSERT_QUOTE = `
  INSERT INTO quotes (
    company_id,
    legal_representative_id,
    issuer_id,
    scope,
    project_id,
    ticket_id,
    document_type,
    pdf_layout_id,
    pdf_primary_color,
    pdf_secondary_color,
    client_visible,
    issue_date,
    expires_at,
    status,
    created_by
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  RETURNING id
`;

export const SQL_DELETE_QUOTE_SECTIONS = `
  DELETE FROM quote_sections WHERE quote_id = $1
`;

export const SQL_INSERT_SECTION = `
  INSERT INTO quote_sections (
    quote_id,
    frequency,
    es_canje,
    apply_tax,
    price_input_mode,
    subtotal,
    tax_amount,
    retention_amount,
    liquid_amount,
    total,
    sort_order
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  RETURNING id
`;

export const SQL_INSERT_LINE_ITEM = `
  INSERT INTO quote_line_items (
    section_id,
    title,
    description,
    price,
    sort_order
  )
  VALUES ($1, $2, $3, $4, $5)
`;

export const SQL_FIND_SECTIONS_BY_QUOTE = `
  SELECT
    id,
    quote_id AS "quoteId",
    frequency,
    es_canje AS "esCanje",
    apply_tax AS "applyTax",
    price_input_mode AS "priceInputMode",
    subtotal::float AS "subtotal",
    tax_amount::float AS "taxAmount",
    retention_amount::float AS "retentionAmount",
    liquid_amount::float AS "liquidAmount",
    total::float AS "total",
    sort_order AS "sortOrder"
  FROM quote_sections
  WHERE quote_id = $1
  ORDER BY sort_order ASC, frequency ASC
`;

export const SQL_FIND_ITEMS_BY_SECTION_IDS = `
  SELECT
    id,
    section_id AS "sectionId",
    title,
    description,
    price::float AS "price",
    sort_order AS "sortOrder"
  FROM quote_line_items
  WHERE section_id = ANY($1::uuid[])
  ORDER BY sort_order ASC, title ASC
`;

export const SQL_FIND_SHARE_BY_QUOTE = `
  SELECT
    id,
    quote_id AS "quoteId",
    token,
    is_enabled AS "isEnabled",
    enabled_at AS "enabledAt",
    expires_at AS "expiresAt",
    disabled_at AS "disabledAt",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM quote_share_links
  WHERE quote_id = $1
`;

export const SQL_FIND_SHARE_BY_TOKEN = `
  SELECT
    sl.id,
    sl.quote_id AS "quoteId",
    sl.token,
    sl.is_enabled AS "isEnabled",
    sl.enabled_at AS "enabledAt",
    sl.expires_at AS "expiresAt",
    sl.disabled_at AS "disabledAt",
    sl.created_at AS "createdAt",
    sl.updated_at AS "updatedAt",
    q.client_visible AS "clientVisible"
  FROM quote_share_links sl
  JOIN quotes q ON q.id = sl.quote_id
  WHERE sl.token = $1
`;

export const SQL_UPSERT_SHARE_LINK = `
  INSERT INTO quote_share_links (
    quote_id,
    token,
    is_enabled,
    enabled_at,
    expires_at,
    disabled_at
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (quote_id) DO UPDATE SET
    token = CASE
      WHEN quote_share_links.token IS NULL OR quote_share_links.token = ''
      THEN EXCLUDED.token
      ELSE quote_share_links.token
    END,
    is_enabled = EXCLUDED.is_enabled,
    enabled_at = EXCLUDED.enabled_at,
    expires_at = EXCLUDED.expires_at,
    disabled_at = EXCLUDED.disabled_at,
    updated_at = NOW()
  RETURNING
    id,
    quote_id AS "quoteId",
    token,
    is_enabled AS "isEnabled",
    enabled_at AS "enabledAt",
    expires_at AS "expiresAt",
    disabled_at AS "disabledAt",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
`;

export const SQL_DELETE_QUOTE = `
  DELETE FROM quotes WHERE id = $1
`;

export const SQL_FIND_COMPANY_PORTAL_USER_IDS = `
  SELECT DISTINCT u.id
  FROM users u
  JOIN users_companies uc ON uc.user_id = u.id
  JOIN users_roles ur ON ur.user_id = u.id
  JOIN roles r ON r.id = ur.role_id
  WHERE uc.company_id = $1
    AND u.is_active = TRUE
    AND r.name = 'cliente'
`;

export const SQL_INSERT_QUOTE_NOTIFICATION = `
  INSERT INTO quote_notifications (
    user_id,
    quote_id,
    company_id,
    actor_user_id,
    type,
    message,
    share_token
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING id
`;

export const SQL_FIND_LEGAL_REP_FOR_COMPANY = `
  SELECT lr.id
  FROM legal_representatives lr
  JOIN company_representatives cr ON cr.legal_representative_id = lr.id
  WHERE cr.company_id = $1
    AND lr.id = $2
`;

export const SQL_FIND_PROJECT_FOR_COMPANY = `
  SELECT id, company_id AS "companyId"
  FROM projects
  WHERE id = $1 AND company_id = $2
`;

export const SQL_FIND_TICKET_CHAIN = `
  SELECT
    t.id,
    t.project_id AS "projectId",
    p.company_id AS "companyId"
  FROM tickets t
  JOIN projects p ON p.id = t.project_id
  WHERE t.id = $1
`;

export const SQL_QUOTE_DETAIL_EXTRAS = `
  SELECT
    c.tax_id AS "companyTaxId",
    trim(both FROM concat(lr.first_name, ' ', lr.last_name)) AS "legalRepresentativeName",
    lr.identification_number AS "legalRepresentativeTaxId"
  FROM quotes q
  JOIN companies c ON c.id = q.company_id
  JOIN legal_representatives lr ON lr.id = q.legal_representative_id
  WHERE q.id = $1
`;

export const SQL_FIND_STATUS_CATALOG = `
  SELECT
    id,
    code,
    name,
    category,
    sort_order AS "sortOrder"
  FROM quote_status_catalog
  WHERE is_active = TRUE
  ORDER BY sort_order ASC, name ASC
`;

export const SQL_FIND_STATUS_BY_CODE = `
  SELECT
    id,
    code,
    name,
    category,
    sort_order AS "sortOrder"
  FROM quote_status_catalog
  WHERE code = $1
    AND is_active = TRUE
`;

export const SQL_FIND_STATUSES_BY_QUOTE_IDS = `
  SELECT
    qs.quote_id AS "quoteId",
    sc.id,
    sc.code,
    sc.name,
    sc.category,
    sc.sort_order AS "sortOrder",
    qs.assigned_at AS "assignedAt"
  FROM quotes_statuses qs
  JOIN quote_status_catalog sc ON sc.id = qs.status_id
  WHERE qs.quote_id = ANY($1::uuid[])
  ORDER BY sc.sort_order ASC
`;

export const SQL_ASSIGN_STATUS = `
  INSERT INTO quotes_statuses (quote_id, status_id, assigned_by)
  VALUES ($1, $2, $3)
  ON CONFLICT DO NOTHING
`;

export const SQL_REMOVE_STATUS = `
  DELETE FROM quotes_statuses
  WHERE quote_id = $1
    AND status_id = $2
`;

export const SQL_REMOVE_STATUSES_IN_CATEGORY = `
  DELETE FROM quotes_statuses qs
  USING quote_status_catalog sc
  WHERE qs.status_id = sc.id
    AND qs.quote_id = $1
    AND sc.category = $2
    AND sc.code <> ALL($3::text[])
`;

export const SQL_FIND_SIGNED_ASSET = `
  SELECT
    a.id,
    a.file_name AS "fileName",
    a.mime_type AS "mimeType",
    a.file_size AS "fileSize",
    a.created_at AS "createdAt"
  FROM assets a
  JOIN quotes q ON q.signed_asset_id = a.id
  WHERE q.id = $1
`;

export const SQL_SET_SIGNED_ASSET = `
  UPDATE quotes
  SET signed_asset_id = $2, updated_at = NOW()
  WHERE id = $1
  RETURNING id
`;

export const SQL_CLEAR_SIGNED_ASSET = `
  UPDATE quotes
  SET signed_asset_id = NULL, updated_at = NOW()
  WHERE id = $1
  RETURNING signed_asset_id AS "signedAssetId"
`;

export const SQL_FIND_PRESETS = `
  SELECT
    id,
    name,
    company_id AS "companyId",
    created_by AS "createdBy",
    payload,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM quote_presets
  WHERE ($1::uuid IS NULL OR company_id IS NULL OR company_id = $1)
  ORDER BY name ASC
`;

export const SQL_FIND_PRESET_BY_ID = `
  SELECT
    id,
    name,
    company_id AS "companyId",
    created_by AS "createdBy",
    payload,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM quote_presets
  WHERE id = $1
`;

export const SQL_INSERT_PRESET = `
  INSERT INTO quote_presets (name, company_id, created_by, payload)
  VALUES ($1, $2, $3, $4::jsonb)
  RETURNING
    id,
    name,
    company_id AS "companyId",
    created_by AS "createdBy",
    payload,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
`;

export const SQL_UPDATE_PRESET = `
  UPDATE quote_presets
  SET
    name = COALESCE($2, name),
    payload = COALESCE($3::jsonb, payload),
    updated_at = NOW()
  WHERE id = $1
  RETURNING
    id,
    name,
    company_id AS "companyId",
    created_by AS "createdBy",
    payload,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
`;

export const SQL_DELETE_PRESET = `
  DELETE FROM quote_presets WHERE id = $1
`;
