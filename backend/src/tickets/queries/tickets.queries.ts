export const TICKET_FROM_JOIN = `
  FROM tickets t
  INNER JOIN ticket_statuses ts ON ts.id = t.status_id
  INNER JOIN ticket_priorities tp ON tp.id = t.priority_id
  LEFT JOIN ticket_categories tc ON tc.id = t.category_id
  LEFT JOIN payment_statuses ps ON ps.id = t.payment_status_id
`;

export const TICKET_COLUMNS = `
  t.id,
  t.project_id AS "projectId",
  t.user_id AS "userId",
  t.title,
  t.description,
  t.status_id AS "statusId",
  ts.name AS "statusName",
  t.priority_id AS "priorityId",
  tp.name AS "priorityName",
  t.category_id AS "categoryId",
  tc.name AS "categoryName",
  t.payment_status_id AS "paymentStatusId",
  ps.name AS "paymentStatusName",
  t.assigned_to_id AS "assignedToId",
  t.created_at AS "createdAt",
  t.updated_at AS "updatedAt"
`;

export const SQL_FIND_ALL_TICKETS = `
  SELECT ${TICKET_COLUMNS}
  ${TICKET_FROM_JOIN}
  WHERE ($1::boolean OR ts.name <> $2)
  AND ($3::uuid IS NULL OR t.project_id = $3)
  ORDER BY t.created_at DESC
`;

export const SQL_FIND_ALL_TICKETS_FOR_PORTAL_USER = `
  SELECT ${TICKET_COLUMNS}
  ${TICKET_FROM_JOIN}
  INNER JOIN projects p ON p.id = t.project_id
  INNER JOIN companies c ON c.id = p.company_id
  INNER JOIN users_companies uc ON uc.company_id = c.id
  WHERE uc.user_id = $1
    AND c.status = 'active'
    AND ts.name <> $2
    AND ($3::uuid IS NULL OR t.project_id = $3)
  ORDER BY t.created_at DESC
`;

export const SQL_FIND_TICKET_BY_ID = `
  SELECT ${TICKET_COLUMNS}
  ${TICKET_FROM_JOIN}
  WHERE t.id = $1
`;

export const SQL_INSERT_TICKET = `
  INSERT INTO tickets (
    project_id,
    user_id,
    title,
    description,
    status_id,
    priority_id,
    category_id,
    payment_status_id,
    assigned_to_id
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING id
`;

export const SQL_UPDATE_TICKET_STATUS = `
  UPDATE tickets
  SET status_id = $1, updated_at = NOW()
  WHERE id = $2
  RETURNING id
`;
