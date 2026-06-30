export const USER_COLUMNS = `
  id,
  email,
  first_name AS "firstName",
  last_name AS "lastName",
  phone_number AS "phoneNumber",
  is_active AS "isActive",
  permissions_version AS "permissionsVersion",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const SQL_FIND_ALL_USERS = `
  SELECT DISTINCT ${USER_COLUMNS}
  FROM users u
  LEFT JOIN users_roles ur ON ur.user_id = u.id
  LEFT JOIN roles r ON r.id = ur.role_id
  LEFT JOIN users_companies uc ON uc.user_id = u.id
  WHERE ($1::boolean IS NULL OR u.is_active = $1)
    AND ($2::text IS NULL OR r.name = $2)
    AND ($3::uuid IS NULL OR uc.company_id = $3)
  ORDER BY u.last_name ASC, u.first_name ASC
`;

export const SQL_FIND_USER_BY_ID = `
  SELECT ${USER_COLUMNS}
  FROM users
  WHERE id = $1
`;

export const SQL_FIND_ACTIVE_USER_BY_ID = `
  SELECT ${USER_COLUMNS}
  FROM users
  WHERE id = $1
    AND is_active = TRUE
`;

export const SQL_EXISTS_USER_BY_EMAIL = `
  SELECT 1
  FROM users
  WHERE email = $1
    AND ($2::uuid IS NULL OR id <> $2)
  LIMIT 1
`;

export const SQL_INSERT_USER = `
  INSERT INTO users (email, password, first_name, last_name, phone_number, is_active)
  VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, $5, $6)
  RETURNING ${USER_COLUMNS}
`;

export const SQL_DEACTIVATE_USER = `
  UPDATE users
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE id = $1
    AND is_active = TRUE
  RETURNING ${USER_COLUMNS}
`;

export const SQL_UPDATE_USER_PASSWORD = `
  UPDATE users
  SET password = crypt($2, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = $1
    AND password = crypt($3, password)
  RETURNING id
`;

export const SQL_UPDATE_USER_PASSWORD_FORCE = `
  UPDATE users
  SET password = crypt($2, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = $1
  RETURNING id
`;
