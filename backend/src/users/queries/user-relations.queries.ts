export const SQL_FIND_ALL_ROLES = `
  SELECT id, name
  FROM roles
  ORDER BY name ASC
`;

export const SQL_FIND_ROLE_BY_ID = `
  SELECT id, name
  FROM roles
  WHERE id = $1
`;

export const SQL_FIND_USER_ROLE_NAMES = `
  SELECT r.name
  FROM roles r
  INNER JOIN users_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = $1
  ORDER BY r.name ASC
`;

export const SQL_FIND_USER_ROLE_IDS = `
  SELECT r.id, r.name
  FROM roles r
  INNER JOIN users_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = $1
  ORDER BY r.name ASC
`;

export const SQL_DELETE_USER_ROLES = `
  DELETE FROM users_roles
  WHERE user_id = $1
`;

export const SQL_INSERT_USER_ROLE = `
  INSERT INTO users_roles (user_id, role_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

export const SQL_FIND_ALL_JOB_TITLES = `
  SELECT id, name
  FROM job_titles
  ORDER BY name ASC
`;

export const SQL_FIND_JOB_TITLE_BY_ID = `
  SELECT id, name
  FROM job_titles
  WHERE id = $1
`;

export const SQL_FIND_USER_JOB_TITLES = `
  SELECT jt.id, jt.name
  FROM job_titles jt
  INNER JOIN users_job_titles ujt ON ujt.job_title_id = jt.id
  WHERE ujt.user_id = $1
  ORDER BY jt.name ASC
`;

export const SQL_DELETE_USER_JOB_TITLES = `
  DELETE FROM users_job_titles
  WHERE user_id = $1
`;

export const SQL_INSERT_USER_JOB_TITLE = `
  INSERT INTO users_job_titles (user_id, job_title_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

export const SQL_FIND_USER_COMPANIES = `
  SELECT c.id, c.name
  FROM companies c
  INNER JOIN users_companies uc ON uc.company_id = c.id
  WHERE uc.user_id = $1
  ORDER BY c.name ASC
`;

export const SQL_INSERT_USER_COMPANY = `
  INSERT INTO users_companies (user_id, company_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

export const SQL_DELETE_USER_COMPANY = `
  DELETE FROM users_companies
  WHERE user_id = $1
    AND company_id = $2
`;

export const SQL_EXISTS_USER_COMPANY = `
  SELECT 1
  FROM users_companies
  WHERE user_id = $1
    AND company_id = $2
  LIMIT 1
`;

export const SQL_EXISTS_COMPANY_ACTIVE = `
  SELECT 1
  FROM companies
  WHERE id = $1
    AND status = 'active'
  LIMIT 1
`;
