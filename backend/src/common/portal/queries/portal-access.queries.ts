export const SQL_USER_HAS_COMPANY = `
  SELECT 1
  FROM users_companies uc
  INNER JOIN companies c ON c.id = uc.company_id
  WHERE uc.user_id = $1
    AND uc.company_id = $2
    AND c.status = 'active'
  LIMIT 1
`;

export const SQL_USER_HAS_PROJECT = `
  SELECT 1
  FROM projects p
  INNER JOIN users_companies uc ON uc.company_id = p.company_id
  WHERE uc.user_id = $1
    AND p.id = $2
  LIMIT 1
`;

export const SQL_USER_HAS_TICKET = `
  SELECT 1
  FROM tickets t
  INNER JOIN projects p ON p.id = t.project_id
  INNER JOIN users_companies uc ON uc.company_id = p.company_id
  WHERE uc.user_id = $1
    AND t.id = $2
  LIMIT 1
`;
