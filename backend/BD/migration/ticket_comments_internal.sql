-- Feature: ticket_comments_internal

ALTER TABLE ticket_comments
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_ticket_comments_is_internal
  ON ticket_comments (ticket_id, is_internal);
