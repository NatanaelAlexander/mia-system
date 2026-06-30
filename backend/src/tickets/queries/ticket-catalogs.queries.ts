export const SQL_FIND_ALL_TICKET_STATUSES = `
  SELECT id, name
  FROM ticket_statuses
  ORDER BY name ASC
`;

export const SQL_FIND_TICKET_STATUS_BY_ID = `
  SELECT id, name
  FROM ticket_statuses
  WHERE id = $1
`;

export const SQL_FIND_TICKET_STATUS_BY_NAME = `
  SELECT id, name
  FROM ticket_statuses
  WHERE name = $1
`;

export const SQL_FIND_ALL_TICKET_PRIORITIES = `
  SELECT id, name
  FROM ticket_priorities
  ORDER BY name ASC
`;

export const SQL_FIND_TICKET_PRIORITY_BY_ID = `
  SELECT id, name
  FROM ticket_priorities
  WHERE id = $1
`;

export const SQL_FIND_ALL_TICKET_CATEGORIES = `
  SELECT id, name
  FROM ticket_categories
  ORDER BY name ASC
`;

export const SQL_FIND_TICKET_CATEGORY_BY_ID = `
  SELECT id, name
  FROM ticket_categories
  WHERE id = $1
`;

export const SQL_FIND_ALL_PAYMENT_STATUSES = `
  SELECT id, name
  FROM payment_statuses
  ORDER BY name ASC
`;

export const SQL_FIND_PAYMENT_STATUS_BY_ID = `
  SELECT id, name
  FROM payment_statuses
  WHERE id = $1
`;
