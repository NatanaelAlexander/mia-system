-- Auth: invalidación de permisos cuando cambian roles del usuario

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS permissions_version INTEGER NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION bump_user_permissions_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET permissions_version = permissions_version + 1,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_users_roles_bump_perm_version ON users_roles;

CREATE TRIGGER tr_users_roles_bump_perm_version
  AFTER INSERT OR DELETE ON users_roles
  FOR EACH ROW
  EXECUTE FUNCTION bump_user_permissions_version();

CREATE OR REPLACE FUNCTION bump_users_permissions_version_by_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_role_id UUID;
BEGIN
  affected_role_id := COALESCE(NEW.role_id, OLD.role_id);

  UPDATE users u
  SET permissions_version = u.permissions_version + 1,
      updated_at = NOW()
  FROM users_roles ur
  WHERE ur.user_id = u.id
    AND ur.role_id = affected_role_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_roles_permissions_bump_perm_version ON roles_permissions;

CREATE TRIGGER tr_roles_permissions_bump_perm_version
  AFTER INSERT OR DELETE ON roles_permissions
  FOR EACH ROW
  EXECUTE FUNCTION bump_users_permissions_version_by_role();
