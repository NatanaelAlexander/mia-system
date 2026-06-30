import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetCompanyRepresentativesDto {
  @ApiProperty({
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'ID de la empresa',
  })
  @IsUUID('4', { message: 'El ID de la empresa no es válido' })
  companyId: string;
}
