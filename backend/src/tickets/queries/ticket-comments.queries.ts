export const TICKET_COMMENT_COLUMNS = `
  tc.id,
  tc.ticket_id AS "ticketId",
  tc.user_id AS "userId",
  tc.comment,
  tc.is_internal AS "isInternal",
  tc.created_at AS "createdAt",
  u.first_name AS "authorFirstName",
  u.last_name AS "authorLastName",
  COALESCE(
    array_agg(jt.name ORDER BY jt.name) FILTER (WHERE jt.name IS NOT NULL),
    ARRAY[]::text[]
  ) AS "authorJobTitles",
  EXISTS (
    SELECT 1
    FROM users_roles ur
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = tc.user_id
      AND r.name = 'cliente'
  ) AS "authorIsClient"
`;

const TICKET_COMMENT_JOINS = `
  FROM ticket_comments tc
  INNER JOIN users u ON u.id = tc.user_id
  LEFT JOIN users_job_titles ujt ON ujt.user_id = u.id
  LEFT JOIN job_titles jt ON jt.id = ujt.job_title_id
`;

const TICKET_COMMENT_GROUP_BY = `
  GROUP BY
    tc.id,
    tc.ticket_id,
    tc.user_id,
    tc.comment,
    tc.is_internal,
    tc.created_at,
    u.first_name,
    u.last_name
`;

export const SQL_FIND_TICKET_COMMENTS = `
  SELECT ${TICKET_COMMENT_COLUMNS}
  ${TICKET_COMMENT_JOINS}
  WHERE tc.ticket_id = $1
  ${TICKET_COMMENT_GROUP_BY}
  ORDER BY tc.created_at ASC
`;

export const SQL_FIND_TICKET_COMMENTS_PUBLIC = `
  SELECT ${TICKET_COMMENT_COLUMNS}
  ${TICKET_COMMENT_JOINS}
  WHERE tc.ticket_id = $1
    AND tc.is_internal = FALSE
  ${TICKET_COMMENT_GROUP_BY}
  ORDER BY tc.created_at ASC
`;

export const SQL_FIND_TICKET_COMMENT_BY_ID = `
  SELECT ${TICKET_COMMENT_COLUMNS}
  ${TICKET_COMMENT_JOINS}
  WHERE tc.id = $1
  ${TICKET_COMMENT_GROUP_BY}
`;

export const SQL_INSERT_TICKET_COMMENT = `
  INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
  VALUES ($1, $2, $3, $4)
  RETURNING id
`;
