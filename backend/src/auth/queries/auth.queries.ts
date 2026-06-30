export const SQL_FIND_USER_BY_EMAIL_AND_PASSWORD = `
  SELECT
    id,
    email,
    first_name AS "firstName",
    last_name AS "lastName",
    is_active AS "isActive",
    permissions_version AS "permissionsVersion"
  FROM users
  WHERE email = $1
    AND password = crypt($2, password)
`;

export const SQL_FIND_USER_BY_ID_ACTIVE = `
  SELECT
    id,
    email,
    first_name AS "firstName",
    last_name AS "lastName",
    is_active AS "isActive",
    permissions_version AS "permissionsVersion"
  FROM users
  WHERE id = $1
    AND is_active = TRUE
`;
