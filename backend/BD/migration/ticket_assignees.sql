-- Feature: asignación múltiple de responsables a tickets

CREATE TABLE IF NOT EXISTS ticket_assignees (
  ticket_id UUID NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ticket_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_assignees_user_id
  ON ticket_assignees (user_id);

-- Conserva el responsable único del modelo anterior.
INSERT INTO ticket_assignees (ticket_id, user_id)
SELECT id, assigned_to_id
FROM tickets
WHERE assigned_to_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Los superadmins activos participan en todos los tickets existentes.
INSERT INTO ticket_assignees (ticket_id, user_id)
SELECT t.id, u.id
FROM tickets t
CROSS JOIN users u
INNER JOIN users_roles ur ON ur.user_id = u.id
INNER JOIN roles r ON r.id = ur.role_id AND r.name = 'super_admin'
WHERE u.is_active = TRUE
ON CONFLICT DO NOTHING;

-- Si un usuario activo recibe el rol superadmin posteriormente, también debe
-- quedar en todos los tickets.
CREATE OR REPLACE FUNCTION assign_super_admin_to_all_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM roles r
    INNER JOIN users u ON u.id = NEW.user_id
    WHERE r.id = NEW.role_id
      AND r.name = 'super_admin'
      AND u.is_active = TRUE
  ) THEN
    INSERT INTO ticket_assignees (ticket_id, user_id)
    SELECT id, NEW.user_id
    FROM tickets
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_assign_super_admin_tickets ON users_roles;

CREATE TRIGGER tr_assign_super_admin_tickets
  AFTER INSERT ON users_roles
  FOR EACH ROW
  EXECUTE FUNCTION assign_super_admin_to_all_tickets();

-- Cubre la reactivación de un superadmin existente.
CREATE OR REPLACE FUNCTION assign_reactivated_super_admin_to_all_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = TRUE
    AND OLD.is_active = FALSE
    AND EXISTS (
      SELECT 1
      FROM users_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = NEW.id
        AND r.name = 'super_admin'
    )
  THEN
    INSERT INTO ticket_assignees (ticket_id, user_id)
    SELECT id, NEW.id
    FROM tickets
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_assign_reactivated_super_admin_tickets ON users;

CREATE TRIGGER tr_assign_reactivated_super_admin_tickets
  AFTER UPDATE OF is_active ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_reactivated_super_admin_to_all_tickets();
