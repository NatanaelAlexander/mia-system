import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin@mia.local' })
  email: string;

  @ApiProperty({ example: 'Admin' })
  firstName: string;

  @ApiProperty({ example: 'Sistema' })
  lastName: string;

  @ApiPropertyOptional({ example: '+56912345678', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1 })
  permissionsVersion: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class UserCompanySummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Empresa Demo' })
  name: string;
}

export class UserDetailResponseDto extends UserResponseDto {
  @ApiProperty({ example: ['admin'], isArray: true })
  roles: string[];

  @ApiProperty({ type: [String], format: 'uuid', isArray: true })
  roleIds: string[];

  @ApiProperty({ example: ['Backend Dev'], isArray: true })
  jobTitles: string[];

  @ApiProperty({ type: [String], format: 'uuid', isArray: true })
  jobTitleIds: string[];

  @ApiProperty({ type: UserCompanySummaryDto, isArray: true })
  companies: UserCompanySummaryDto[];
}

export class RoleOptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin' })
  name: string;
}

export class JobTitleOptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Backend Dev' })
  name: string;
}

export class JobTitleListItemResponseDto extends JobTitleOptionResponseDto {
  @ApiProperty({ example: 3, description: 'Usuarios con este cargo asignado' })
  userCount: number;
}
