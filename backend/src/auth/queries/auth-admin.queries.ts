export const SQL_COUNT_ROLES = `
  SELECT COUNT(*)::int AS count FROM roles
`;

export const SQL_COUNT_PERMISSIONS = `
  SELECT COUNT(*)::int AS count FROM permissions
`;

export const SQL_COUNT_USERS_WITHOUT_ROLES = `
  SELECT COUNT(*)::int AS count
  FROM users u
  WHERE u.is_active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM users_roles ur WHERE ur.user_id = u.id
    )
`;

export const SQL_COUNT_USERS_WITHOUT_PERMISSIONS = `
  SELECT COUNT(*)::int AS count
  FROM users u
  WHERE u.is_active = TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM users_roles ur
      INNER JOIN roles_permissions rp ON rp.role_id = ur.role_id
      WHERE ur.user_id = u.id
    )
`;

export const SQL_ADMIN_ROLE_PERMISSION_COUNT = `
  SELECT COUNT(DISTINCT p.id)::int AS count
  FROM roles r
  INNER JOIN roles_permissions rp ON rp.role_id = r.id
  INNER JOIN permissions p ON p.id = rp.permission_id
  WHERE r.name = 'admin'
`;

export const SQL_SUPER_ADMIN_ROLE_PERMISSION_COUNT = `
  SELECT COUNT(DISTINCT p.id)::int AS count
  FROM roles r
  INNER JOIN roles_permissions rp ON rp.role_id = r.id
  INNER JOIN permissions p ON p.id = rp.permission_id
  WHERE r.name = 'super_admin'
`;

export const SQL_LIST_PERMISSIONS = `
  SELECT id, name, module
  FROM permissions
  ORDER BY module ASC, name ASC
`;
