import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { JwtAccessPayload } from '../types/auth.types';

export const CurrentUser = createParamDecorator(
  (
    field: keyof JwtAccessPayload | undefined,
    ctx: ExecutionContext,
  ): JwtAccessPayload | JwtAccessPayload[keyof JwtAccessPayload] => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (field) {
      return user[field];
    }

    return user;
  },
);
