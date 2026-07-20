export const COMPANY_COLUMNS = `
  id,
  name,
  tax_id AS "taxId",
  address,
  phone_number AS "phoneNumber",
  email,
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const SQL_FIND_ALL_ACTIVE_COMPANIES = `
  SELECT ${COMPANY_COLUMNS}
  FROM companies
  WHERE status = $1
  ORDER BY name ASC
`;

export const SQL_FIND_COMPANIES_FILTERED = `
  SELECT ${COMPANY_COLUMNS}
  FROM companies
  WHERE ($1::text IS NULL OR status = $1)
    AND (
      $2::text IS NULL
      OR name ILIKE '%' || $2 || '%'
      OR regexp_replace(tax_id, '[.\\-]', '', 'g') ILIKE '%' || regexp_replace($2, '[.\\-]', '', 'g') || '%'
    )
    AND ($3::uuid[] IS NULL OR id = ANY($3::uuid[]))
  ORDER BY name ASC
`;

export const SQL_FIND_COMPANIES_FOR_PORTAL_USER = `
  SELECT ${COMPANY_COLUMNS}
  FROM companies c
  INNER JOIN users_companies uc ON uc.company_id = c.id
  WHERE uc.user_id = $1
    AND c.status = $2
  ORDER BY c.name ASC
`;

export const SQL_FIND_COMPANY_BY_ID_ACTIVE = `
  SELECT ${COMPANY_COLUMNS}
  FROM companies
  WHERE id = $1 AND status = $2
`;

export const SQL_FIND_COMPANY_BY_ID = `
  SELECT ${COMPANY_COLUMNS}
  FROM companies
  WHERE id = $1
`;

export const SQL_EXISTS_COMPANY_BY_TAX_ID = `
  SELECT 1
  FROM companies
  WHERE tax_id = $1
    AND ($2::uuid IS NULL OR id <> $2)
  LIMIT 1
`;

export const SQL_INSERT_COMPANY = `
  INSERT INTO companies (name, tax_id, address, phone_number, email, status)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING ${COMPANY_COLUMNS}
`;

export const SQL_DEACTIVATE_COMPANY = `
  UPDATE companies
  SET status = $1, updated_at = NOW()
  WHERE id = $2 AND status = $3
  RETURNING ${COMPANY_COLUMNS}
`;
