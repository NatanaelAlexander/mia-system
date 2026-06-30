-- Feature: refresh_sessions (revocación server-side + rotación de refresh tokens)

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by_id UUID REFERENCES refresh_sessions (id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user_active
  ON refresh_sessions (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_expires_at
  ON refresh_sessions (expires_at);
