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
  INNER JOIN companies c ON c.id = p.company_id
  INNER JOIN users_companies uc ON uc.company_id = c.id
  WHERE uc.user_id = $1
    AND p.id = $2
    AND c.status = 'active'
  LIMIT 1
`;

export const SQL_USER_HAS_TICKET = `
  SELECT 1
  FROM tickets t
  INNER JOIN projects p ON p.id = t.project_id
  INNER JOIN companies c ON c.id = p.company_id
  INNER JOIN users_companies uc ON uc.company_id = c.id
  WHERE uc.user_id = $1
    AND t.id = $2
    AND c.status = 'active'
  LIMIT 1
`;

/**
 * Asset reachable by portal user via ticket, comment, or project of an active company.
 */
export const SQL_USER_HAS_ASSET = `
  SELECT 1
  FROM assets a
  WHERE a.id = $2
    AND (
      EXISTS (
        SELECT 1
        FROM ticket_assets ta
        INNER JOIN tickets t ON t.id = ta.ticket_id
        INNER JOIN projects p ON p.id = t.project_id
        INNER JOIN companies c ON c.id = p.company_id
        INNER JOIN users_companies uc ON uc.company_id = c.id
        WHERE ta.asset_id = a.id
          AND uc.user_id = $1
          AND c.status = 'active'
      )
      OR EXISTS (
        SELECT 1
        FROM ticket_comment_assets tca
        INNER JOIN ticket_comments tc ON tc.id = tca.ticket_comment_id
        INNER JOIN tickets t ON t.id = tc.ticket_id
        INNER JOIN projects p ON p.id = t.project_id
        INNER JOIN companies c ON c.id = p.company_id
        INNER JOIN users_companies uc ON uc.company_id = c.id
        WHERE tca.asset_id = a.id
          AND uc.user_id = $1
          AND c.status = 'active'
          AND tc.is_internal = FALSE
      )
      OR EXISTS (
        SELECT 1
        FROM projects_assets pa
        INNER JOIN projects p ON p.id = pa.project_id
        INNER JOIN companies c ON c.id = p.company_id
        INNER JOIN users_companies uc ON uc.company_id = c.id
        WHERE pa.asset_id = a.id
          AND uc.user_id = $1
          AND c.status = 'active'
      )
    )
  LIMIT 1
`;
