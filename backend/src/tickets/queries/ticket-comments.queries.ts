export const TICKET_COMMENT_COLUMNS = `
  id,
  ticket_id AS "ticketId",
  user_id AS "userId",
  comment,
  created_at AS "createdAt"
`;

export const SQL_FIND_TICKET_COMMENTS = `
  SELECT ${TICKET_COMMENT_COLUMNS}
  FROM ticket_comments
  WHERE ticket_id = $1
  ORDER BY created_at ASC
`;

export const SQL_FIND_TICKET_COMMENT_BY_ID = `
  SELECT ${TICKET_COMMENT_COLUMNS}
  FROM ticket_comments
  WHERE id = $1
`;

export const SQL_INSERT_TICKET_COMMENT = `
  INSERT INTO ticket_comments (ticket_id, user_id, comment)
  VALUES ($1, $2, $3)
  RETURNING ${TICKET_COMMENT_COLUMNS}
`;
