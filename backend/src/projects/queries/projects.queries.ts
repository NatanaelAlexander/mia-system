export const PROJECT_COLUMNS = `
  id,
  company_id AS "companyId",
  name,
  type,
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const SQL_FIND_ALL_ACTIVE_PROJECTS = `
  SELECT ${PROJECT_COLUMNS}
  FROM projects
  WHERE status = $1
  ORDER BY name ASC
`;

export const SQL_FIND_PROJECTS_FOR_PORTAL_USER = `
  SELECT ${PROJECT_COLUMNS}
  FROM projects p
  INNER JOIN users_companies uc ON uc.company_id = p.company_id
  WHERE uc.user_id = $1
    AND p.status = $2
    AND ($3::uuid IS NULL OR p.company_id = $3)
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
  INSERT INTO projects (company_id, name, type, status)
  VALUES ($1, $2, $3, $4)
  RETURNING ${PROJECT_COLUMNS}
`;

export const SQL_DEACTIVATE_PROJECT = `
  UPDATE projects
  SET status = $1, updated_at = NOW()
  WHERE id = $2 AND status <> $1
  RETURNING ${PROJECT_COLUMNS}
`;
