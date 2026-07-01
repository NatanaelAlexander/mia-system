export const TICKET_COMMENT_COLUMNS = `
  tc.id,
  tc.ticket_id AS "ticketId",
  tc.user_id AS "userId",
  tc.comment,
  tc.is_internal AS "isInternal",
  tc.created_at AS "createdAt",
  u.first_name AS "authorFirstName",
  u.last_name AS "authorLastName"
`;

export const SQL_FIND_TICKET_COMMENTS = `
  SELECT ${TICKET_COMMENT_COLUMNS}
  FROM ticket_comments tc
  INNER JOIN users u ON u.id = tc.user_id
  WHERE tc.ticket_id = $1
  ORDER BY tc.created_at ASC
`;

export const SQL_FIND_TICKET_COMMENTS_PUBLIC = `
  SELECT ${TICKET_COMMENT_COLUMNS}
  FROM ticket_comments tc
  INNER JOIN users u ON u.id = tc.user_id
  WHERE tc.ticket_id = $1
    AND tc.is_internal = FALSE
  ORDER BY tc.created_at ASC
`;

export const SQL_FIND_TICKET_COMMENT_BY_ID = `
  SELECT ${TICKET_COMMENT_COLUMNS}
  FROM ticket_comments tc
  INNER JOIN users u ON u.id = tc.user_id
  WHERE tc.id = $1
`;

export const SQL_INSERT_TICKET_COMMENT = `
  INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
  VALUES ($1, $2, $3, $4)
  RETURNING id
`;
