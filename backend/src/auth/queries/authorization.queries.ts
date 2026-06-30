export const SQL_FIND_USER_PERMISSIONS_VERSION = `
  SELECT permissions_version AS "permissionsVersion"
  FROM users
  WHERE id = $1
    AND is_active = TRUE
`;

export const SQL_FIND_USER_ROLES = `
  SELECT r.name
  FROM roles r
  INNER JOIN users_roles ur ON ur.role_id = r.id
  WHERE ur.user_id = $1
  ORDER BY r.name ASC
`;

export const SQL_FIND_USER_PERMISSIONS = `
  SELECT DISTINCT p.name
  FROM permissions p
  INNER JOIN roles_permissions rp ON rp.permission_id = p.id
  INNER JOIN users_roles ur ON ur.role_id = rp.role_id
  WHERE ur.user_id = $1
  ORDER BY p.name ASC
`;
