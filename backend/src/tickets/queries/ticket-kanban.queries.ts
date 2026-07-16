import { TICKET_COLUMNS, TICKET_FROM_JOIN } from './tickets.queries';

export const KANBAN_LAST_COMMENT_JOIN_INTERNAL = `
  LEFT JOIN LATERAL (
    SELECT
      u.first_name AS "lastCommentAuthorFirstName",
      u.last_name AS "lastCommentAuthorLastName",
      tc.created_at AS "lastCommentAt"
    FROM ticket_comments tc
    INNER JOIN users u ON u.id = tc.user_id
    WHERE tc.ticket_id = t.id
    ORDER BY tc.created_at DESC
    LIMIT 1
  ) lc ON TRUE
`;

export const KANBAN_LAST_COMMENT_JOIN_PORTAL = `
  LEFT JOIN LATERAL (
    SELECT
      u.first_name AS "lastCommentAuthorFirstName",
      u.last_name AS "lastCommentAuthorLastName",
      tc.created_at AS "lastCommentAt"
    FROM ticket_comments tc
    INNER JOIN users u ON u.id = tc.user_id
    WHERE tc.ticket_id = t.id
      AND tc.is_internal = FALSE
    ORDER BY tc.created_at DESC
    LIMIT 1
  ) lc ON TRUE
`;

export const KANBAN_EXTRA_COLUMNS = `
  lc."lastCommentAuthorFirstName",
  lc."lastCommentAuthorLastName",
  lc."lastCommentAt"
`;

const KANBAN_FILTER_CLAUSE = `
  AND (
    $4::text IS NULL
    OR $4 = 'all'
    OR (
      $4 = 'active'
      AND ts.name NOT IN ('Terminado', 'Cancelado')
    )
    OR (
      $4 = 'closed'
      AND ts.name IN ('Terminado', 'Cancelado')
    )
  )
  AND (
    NOT COALESCE($5::boolean, FALSE)
    OR ts.name IN ('Tomado', 'En desarrollo', 'QA', 'Esperando cliente')
  )
`;

/**
 * Params:
 * $1 includeDrafts, $2 draftStatusName, $3 projectId,
 * $4 lifecycle, $5 workingOnly,
 * $6 isSuperAdmin, $7 actorUserId
 */
export const SQL_FIND_ALL_TICKETS_KANBAN = `
  SELECT
    ${TICKET_COLUMNS},
    ${KANBAN_EXTRA_COLUMNS}
  ${TICKET_FROM_JOIN}
  ${KANBAN_LAST_COMMENT_JOIN_INTERNAL}
  WHERE ($1::boolean OR ts.name <> $2)
    AND ($3::uuid IS NULL OR t.project_id = $3)
    ${KANBAN_FILTER_CLAUSE}
    AND (
      COALESCE($6::boolean, FALSE)
      OR EXISTS (
        SELECT 1
        FROM ticket_assignees ta
        WHERE ta.ticket_id = t.id
          AND ta.user_id = $7::uuid
      )
    )
  ORDER BY t.updated_at DESC
`;

export const SQL_FIND_ALL_TICKETS_FOR_PORTAL_USER_KANBAN = `
  SELECT
    ${TICKET_COLUMNS},
    ${KANBAN_EXTRA_COLUMNS}
  ${TICKET_FROM_JOIN}
  INNER JOIN projects p ON p.id = t.project_id
  INNER JOIN companies c ON c.id = p.company_id
  INNER JOIN users_companies uc ON uc.company_id = c.id
  ${KANBAN_LAST_COMMENT_JOIN_PORTAL}
  WHERE uc.user_id = $1
    AND c.status = 'active'
    AND ts.name <> $2
    AND ($3::uuid IS NULL OR t.project_id = $3)
    ${KANBAN_FILTER_CLAUSE}
  ORDER BY t.updated_at DESC
`;
