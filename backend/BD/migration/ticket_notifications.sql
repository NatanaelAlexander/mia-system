-- Feature: ticket_notifications

CREATE TABLE IF NOT EXISTS ticket_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL CHECK (type IN ('ticket_created', 'ticket_comment')),
  comment_id UUID REFERENCES ticket_comments (id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_notifications_user_created
  ON ticket_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_notifications_user_unread
  ON ticket_notifications (user_id)
  WHERE read_at IS NULL;
