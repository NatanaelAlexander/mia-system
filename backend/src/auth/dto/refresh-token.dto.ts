import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token emitido en el login' })
  @IsString({ message: 'El refresh token debe ser texto' })
  @MinLength(1)
  refreshToken: string;
}
