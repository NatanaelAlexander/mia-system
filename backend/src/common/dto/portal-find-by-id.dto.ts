import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { PortalUserDto } from './portal-user.dto';

export class PortalFindByIdDto extends PortalUserDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID no es válido' })
  id: string;
}
