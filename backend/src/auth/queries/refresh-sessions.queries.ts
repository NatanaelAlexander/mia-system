export const REFRESH_SESSION_COLUMNS = `
  id,
  user_id AS "userId",
  token_hash AS "tokenHash",
  expires_at AS "expiresAt",
  revoked_at AS "revokedAt",
  replaced_by_id AS "replacedById",
  user_agent AS "userAgent",
  ip_address AS "ipAddress",
  created_at AS "createdAt"
`;

export const SQL_FIND_REFRESH_SESSION_BY_ID = `
  SELECT ${REFRESH_SESSION_COLUMNS}
  FROM refresh_sessions
  WHERE id = $1
`;

export const SQL_FIND_ACTIVE_REFRESH_SESSION = `
  SELECT ${REFRESH_SESSION_COLUMNS}
  FROM refresh_sessions
  WHERE id = $1
    AND user_id = $2
    AND revoked_at IS NULL
    AND expires_at > NOW()
`;

export const SQL_INSERT_REFRESH_SESSION = `
  INSERT INTO refresh_sessions (
    id,
    user_id,
    token_hash,
    expires_at,
    user_agent,
    ip_address
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING ${REFRESH_SESSION_COLUMNS}
`;

export const SQL_REVOKE_REFRESH_SESSION = `
  UPDATE refresh_sessions
  SET revoked_at = NOW(),
      replaced_by_id = $3
  WHERE id = $1
    AND user_id = $2
    AND revoked_at IS NULL
`;

export const SQL_REVOKE_ALL_USER_REFRESH_SESSIONS = `
  UPDATE refresh_sessions
  SET revoked_at = NOW()
  WHERE user_id = $1
    AND revoked_at IS NULL
`;
