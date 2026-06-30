import { ApiProperty } from '@nestjs/swagger';
import { AuthSurface } from '../../types/auth.types';

export class AuthUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'cliente@mia.local' })
  email: string;

  @ApiProperty({ example: 'Cliente' })
  firstName: string;

  @ApiProperty({ example: 'Demo' })
  lastName: string;

  @ApiProperty({ example: ['cliente'], isArray: true })
  roles: string[];

  @ApiProperty({
    example: ['portal'],
    isArray: true,
    description: 'Superficies HTTP permitidas: internal | portal',
  })
  surfaces: AuthSurface[];

  @ApiProperty({
    example: ['tickets:read', 'tickets:create'],
    isArray: true,
    description: 'Snapshot para UI; la API valida contra BD en cada request',
  })
  permissions: string[];

  @ApiProperty({
    example: 1,
    description:
      'Debe coincidir con users.permissions_version; si cambia, renovar con refresh',
  })
  permVersion: number;
}

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ example: 900, description: 'Segundos de vida del access token' })
  expiresIn: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}
