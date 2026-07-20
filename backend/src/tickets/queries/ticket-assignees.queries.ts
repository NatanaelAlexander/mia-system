export const SQL_FIND_TICKET_ASSIGNEES = `
  SELECT
    u.id,
    u.email,
    u.first_name AS "firstName",
    u.last_name AS "lastName",
    ARRAY_AGG(DISTINCT r.name ORDER BY r.name) AS roles,
    BOOL_OR(r.name = 'super_admin') AS "isSuperAdmin"
  FROM ticket_assignees ta
  INNER JOIN users u ON u.id = ta.user_id
  INNER JOIN users_roles ur ON ur.user_id = u.id
  INNER JOIN roles r ON r.id = ur.role_id
  WHERE ta.ticket_id = $1
  GROUP BY u.id, u.email, u.first_name, u.last_name
  ORDER BY BOOL_OR(r.name = 'super_admin') DESC, u.last_name, u.first_name
`;

export const SQL_ASSIGN_ACTIVE_SUPER_ADMINS = `
  INSERT INTO ticket_assignees (ticket_id, user_id)
  SELECT $1, u.id
  FROM users u
  INNER JOIN users_roles ur ON ur.user_id = u.id
  INNER JOIN roles r ON r.id = ur.role_id
  WHERE u.is_active = TRUE
    AND r.name = 'super_admin'
  ON CONFLICT DO NOTHING
`;

export const SQL_FIND_VALID_INTERNAL_ASSIGNEES = `
  SELECT DISTINCT u.id
  FROM users u
  INNER JOIN users_roles ur ON ur.user_id = u.id
  INNER JOIN roles r ON r.id = ur.role_id
  WHERE u.is_active = TRUE
    AND r.name IN ('admin', 'super_admin')
    AND u.id = ANY($1::uuid[])
`;

export const SQL_REPLACE_TICKET_ASSIGNEES = `
  WITH requested AS (
    SELECT UNNEST($2::uuid[]) AS user_id
  ),
  mandatory_super_admins AS (
    SELECT DISTINCT u.id AS user_id
    FROM users u
    INNER JOIN users_roles ur ON ur.user_id = u.id
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE u.is_active = TRUE
      AND r.name = 'super_admin'
  ),
  desired AS (
    SELECT user_id FROM requested
    UNION
    SELECT user_id FROM mandatory_super_admins
  ),
  removed AS (
    DELETE FROM ticket_assignees
    WHERE ticket_id = $1
      AND user_id NOT IN (SELECT user_id FROM desired)
  )
  INSERT INTO ticket_assignees (ticket_id, user_id)
  SELECT $1, user_id
  FROM desired
  ON CONFLICT DO NOTHING
`;

export const SQL_IS_TICKET_ASSIGNEE = `
  SELECT EXISTS (
    SELECT 1
    FROM ticket_assignees
    WHERE ticket_id = $1
      AND user_id = $2
  ) AS "isAssigned"
`;

/** Proyectos donde el usuario es responsable de al menos un ticket. */
export const SQL_ADMIN_SCOPED_PROJECT_IDS = `
  SELECT DISTINCT t.project_id AS id
  FROM ticket_assignees ta
  INNER JOIN tickets t ON t.id = ta.ticket_id
  WHERE ta.user_id = $1
`;

/** Empresas de esos proyectos. */
export const SQL_ADMIN_SCOPED_COMPANY_IDS = `
  SELECT DISTINCT p.company_id AS id
  FROM ticket_assignees ta
  INNER JOIN tickets t ON t.id = ta.ticket_id
  INNER JOIN projects p ON p.id = t.project_id
  WHERE ta.user_id = $1
`;

export const SQL_HAS_PROJECT_SCOPE_ACCESS = `
  SELECT EXISTS (
    SELECT 1
    FROM ticket_assignees ta
    INNER JOIN tickets t ON t.id = ta.ticket_id
    WHERE ta.user_id = $2
      AND t.project_id = $1
  ) AS "hasAccess"
`;

export const SQL_HAS_COMPANY_SCOPE_ACCESS = `
  SELECT EXISTS (
    SELECT 1
    FROM ticket_assignees ta
    INNER JOIN tickets t ON t.id = ta.ticket_id
    INNER JOIN projects p ON p.id = t.project_id
    WHERE ta.user_id = $2
      AND p.company_id = $1
  ) AS "hasAccess"
`;

/** El ticket pertenece a un proyecto donde el usuario ya es assignee de algún ticket. */
export const SQL_IS_TICKET_IN_SCOPED_PROJECT = `
  SELECT EXISTS (
    SELECT 1
    FROM tickets target
    WHERE target.id = $1
      AND EXISTS (
        SELECT 1
        FROM ticket_assignees ta
        INNER JOIN tickets scoped ON scoped.id = ta.ticket_id
        WHERE ta.user_id = $2
          AND scoped.project_id = target.project_id
      )
  ) AS "hasAccess"
`;

export const SQL_FIND_ASSIGNEES_BY_TICKET_IDS = `
  SELECT
    ta.ticket_id AS "ticketId",
    u.id,
    u.email,
    u.first_name AS "firstName",
    u.last_name AS "lastName",
    ARRAY_AGG(DISTINCT r.name ORDER BY r.name) AS roles,
    BOOL_OR(r.name = 'super_admin') AS "isSuperAdmin"
  FROM ticket_assignees ta
  INNER JOIN users u ON u.id = ta.user_id
  INNER JOIN users_roles ur ON ur.user_id = u.id
  INNER JOIN roles r ON r.id = ur.role_id
  WHERE ta.ticket_id = ANY($1::uuid[])
  GROUP BY ta.ticket_id, u.id, u.email, u.first_name, u.last_name
  ORDER BY ta.ticket_id, BOOL_OR(r.name = 'super_admin') DESC, u.last_name, u.first_name
`;
