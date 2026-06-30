import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'is_public';

/** Omite JWT, superficie y permisos (p. ej. login, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
