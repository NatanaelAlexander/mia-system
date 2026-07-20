-- Feature: notification_dismiss_cleanup
-- Soft-dismiss per user + age-based hard purge support

ALTER TABLE ticket_notifications
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

ALTER TABLE quote_notifications
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ticket_notifications_user_active
  ON ticket_notifications (user_id, created_at DESC)
  WHERE dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quote_notifications_user_active
  ON quote_notifications (user_id, created_at DESC)
  WHERE dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_notifications_created_at
  ON ticket_notifications (created_at);

CREATE INDEX IF NOT EXISTS idx_quote_notifications_created_at
  ON quote_notifications (created_at);
