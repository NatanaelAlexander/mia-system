import { PermissionMatchMode } from './permissions.types';

export function hasPermissions(
  granted: string[],
  required: string[],
  mode: PermissionMatchMode = 'all',
): boolean {
  if (required.length === 0) {
    return true;
  }

  const grantedSet = new Set(granted);

  if (mode === 'any') {
    return required.some((permission) => grantedSet.has(permission));
  }

  return required.every((permission) => grantedSet.has(permission));
}
