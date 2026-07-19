export const SQL_INSERT_TICKET_NOTIFICATION = `
  INSERT INTO ticket_notifications (
    user_id,
    ticket_id,
    project_id,
    type,
    comment_id,
    actor_user_id,
    message
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING id
`;

export const SQL_FIND_NOTIFICATIONS_BY_USER = `
  SELECT * FROM (
    SELECT
      n.id,
      'ticket'::text AS kind,
      n.user_id AS "userId",
      n.ticket_id AS "ticketId",
      n.project_id AS "projectId",
      NULL::uuid AS "quoteId",
      NULL::uuid AS "companyId",
      NULL::text AS "shareToken",
      n.type,
      n.comment_id AS "commentId",
      n.actor_user_id AS "actorUserId",
      actor.first_name AS "actorFirstName",
      actor.last_name AS "actorLastName",
      t.title AS "ticketTitle",
      n.message,
      n.read_at AS "readAt",
      n.created_at AS "createdAt"
    FROM ticket_notifications n
    INNER JOIN tickets t ON t.id = n.ticket_id
    INNER JOIN users actor ON actor.id = n.actor_user_id
    WHERE n.user_id = $1
      AND n.dismissed_at IS NULL

    UNION ALL

    SELECT
      qn.id,
      'quote'::text AS kind,
      qn.user_id AS "userId",
      NULL::uuid AS "ticketId",
      NULL::uuid AS "projectId",
      qn.quote_id AS "quoteId",
      qn.company_id AS "companyId",
      qn.share_token AS "shareToken",
      qn.type,
      NULL::uuid AS "commentId",
      qn.actor_user_id AS "actorUserId",
      actor.first_name AS "actorFirstName",
      actor.last_name AS "actorLastName",
      NULL::text AS "ticketTitle",
      qn.message,
      qn.read_at AS "readAt",
      qn.created_at AS "createdAt"
    FROM quote_notifications qn
    INNER JOIN users actor ON actor.id = qn.actor_user_id
    WHERE qn.user_id = $1
      AND qn.dismissed_at IS NULL
  ) notifications
  ORDER BY "createdAt" DESC
  LIMIT $2
`;

export const SQL_COUNT_UNREAD_NOTIFICATIONS = `
  SELECT (
    (SELECT COUNT(*)::int FROM ticket_notifications
     WHERE user_id = $1 AND read_at IS NULL AND dismissed_at IS NULL)
    +
    (SELECT COUNT(*)::int FROM quote_notifications
     WHERE user_id = $1 AND read_at IS NULL AND dismissed_at IS NULL)
  ) AS count
`;

export const SQL_MARK_NOTIFICATION_READ = `
  UPDATE ticket_notifications
  SET read_at = NOW()
  WHERE id = $1
    AND user_id = $2
    AND read_at IS NULL
    AND dismissed_at IS NULL
  RETURNING id
`;

export const SQL_MARK_QUOTE_NOTIFICATION_READ = `
  UPDATE quote_notifications
  SET read_at = NOW()
  WHERE id = $1
    AND user_id = $2
    AND read_at IS NULL
    AND dismissed_at IS NULL
  RETURNING id
`;

export const SQL_MARK_ALL_NOTIFICATIONS_READ = `
  WITH ticket_upd AS (
    UPDATE ticket_notifications
    SET read_at = NOW()
    WHERE user_id = $1
      AND read_at IS NULL
      AND dismissed_at IS NULL
    RETURNING id
  ),
  quote_upd AS (
    UPDATE quote_notifications
    SET read_at = NOW()
    WHERE user_id = $1
      AND read_at IS NULL
      AND dismissed_at IS NULL
    RETURNING id
  )
  SELECT
    (SELECT COUNT(*)::int FROM ticket_upd)
    + (SELECT COUNT(*)::int FROM quote_upd) AS count
`;

export const SQL_MARK_TICKET_NOTIFICATIONS_READ = `
  UPDATE ticket_notifications
  SET read_at = NOW()
  WHERE user_id = $1
    AND ticket_id = $2
    AND read_at IS NULL
    AND dismissed_at IS NULL
`;

export const SQL_DISMISS_TICKET_NOTIFICATION = `
  UPDATE ticket_notifications
  SET dismissed_at = NOW(),
      read_at = COALESCE(read_at, NOW())
  WHERE id = $1
    AND user_id = $2
    AND dismissed_at IS NULL
  RETURNING id
`;

export const SQL_DISMISS_QUOTE_NOTIFICATION = `
  UPDATE quote_notifications
  SET dismissed_at = NOW(),
      read_at = COALESCE(read_at, NOW())
  WHERE id = $1
    AND user_id = $2
    AND dismissed_at IS NULL
  RETURNING id
`;

export const SQL_PURGE_OLD_NOTIFICATIONS = `
  WITH ticket_del AS (
    DELETE FROM ticket_notifications
    WHERE created_at < NOW() - INTERVAL '7 days'
    RETURNING id
  ),
  quote_del AS (
    DELETE FROM quote_notifications
    WHERE created_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT
    (SELECT COUNT(*)::int FROM ticket_del)
    + (SELECT COUNT(*)::int FROM quote_del) AS count
`;

export const SQL_FIND_TICKET_ASSIGNEE_USER_IDS = `
  SELECT user_id AS "userId"
  FROM ticket_assignees
  WHERE ticket_id = $1
`;

export const SQL_FIND_INTERNAL_USER_IDS = `
  SELECT DISTINCT u.id AS "userId"
  FROM users u
  INNER JOIN users_roles ur ON ur.user_id = u.id
  INNER JOIN roles r ON r.id = ur.role_id
  WHERE u.is_active = TRUE
    AND u.id = ANY($1::uuid[])
    AND r.name IN ('admin', 'super_admin')
`;
