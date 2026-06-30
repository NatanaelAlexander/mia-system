export const SQL_INSERT_TICKET_STATUS_HISTORY = `
  INSERT INTO ticket_status_history (ticket_id, status_id, user_id)
  VALUES ($1, $2, $3)
  RETURNING id
`;

export const SQL_FIND_TICKET_STATUS_HISTORY = `
  SELECT
    h.id,
    h.ticket_id AS "ticketId",
    h.status_id AS "statusId",
    ts.name AS "statusName",
    h.user_id AS "userId",
    h.created_at AS "createdAt"
  FROM ticket_status_history h
  INNER JOIN ticket_statuses ts ON ts.id = h.status_id
  WHERE h.ticket_id = $1
  ORDER BY h.created_at ASC
`;
