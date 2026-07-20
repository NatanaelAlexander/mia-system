export const PROJECT_COLUMNS = `
  id,
  company_id AS "companyId",
  name,
  description,
  type,
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const SQL_FIND_ALL_ACTIVE_PROJECTS = `
  SELECT ${PROJECT_COLUMNS}
  FROM projects
  WHERE status = $1
    AND ($2::uuid[] IS NULL OR id = ANY($2::uuid[]))
  ORDER BY name ASC
`;

export const SQL_FIND_PROJECTS_FILTERED = `
  SELECT
    p.id,
    p.company_id AS "companyId",
    p.name,
    p.description,
    p.type,
    p.status,
    p.created_at AS "createdAt",
    p.updated_at AS "updatedAt"
  FROM projects p
  INNER JOIN companies c ON c.id = p.company_id
  WHERE ($1::text IS NULL OR p.status = $1)
    AND ($2::uuid IS NULL OR p.company_id = $2)
    AND (
      $3::text IS NULL
      OR c.name ILIKE '%' || $3 || '%'
      OR regexp_replace(c.tax_id, '[.\\-]', '', 'g') ILIKE '%' || regexp_replace($3, '[.\\-]', '', 'g') || '%'
    )
    AND ($4::uuid[] IS NULL OR p.id = ANY($4::uuid[]))
  ORDER BY p.name ASC
`;

export const SQL_FIND_PROJECTS_FOR_PORTAL_USER = `
  SELECT
    p.id,
    p.company_id AS "companyId",
    p.name,
    p.description,
    p.type,
    p.status,
    p.created_at AS "createdAt",
    p.updated_at AS "updatedAt"
  FROM projects p
  INNER JOIN users_companies uc ON uc.company_id = p.company_id
  INNER JOIN companies c ON c.id = p.company_id
  WHERE uc.user_id = $1
    AND c.status = 'active'
    AND p.status = $2
    AND ($3::uuid IS NULL OR p.company_id = $3)
    AND (
      $4::text IS NULL
      OR c.name ILIKE '%' || $4 || '%'
      OR regexp_replace(c.tax_id, '[.\\-]', '', 'g') ILIKE '%' || regexp_replace($4, '[.\\-]', '', 'g') || '%'
    )
  ORDER BY p.name ASC
`;

export const SQL_FIND_PROJECT_BY_ID = `
  SELECT ${PROJECT_COLUMNS}
  FROM projects
  WHERE id = $1
`;

export const SQL_FIND_PROJECTS_BY_COMPANY = `
  SELECT ${PROJECT_COLUMNS}
  FROM projects
  WHERE company_id = $1 AND status = $2
  ORDER BY name ASC
`;

export const SQL_INSERT_PROJECT = `
  INSERT INTO projects (company_id, name, description, type, status)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING ${PROJECT_COLUMNS}
`;

export const SQL_DEACTIVATE_PROJECT = `
  UPDATE projects
  SET status = $1, updated_at = NOW()
  WHERE id = $2 AND status <> $1
  RETURNING ${PROJECT_COLUMNS}
`;
