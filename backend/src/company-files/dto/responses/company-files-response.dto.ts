import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyFolderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  companyId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentId: string | null;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  createdById: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class CompanyFileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiPropertyOptional({ nullable: true })
  mimeType: string | null;

  @ApiPropertyOptional({ nullable: true })
  fileSize: number | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  uploadedById: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  folderId: string | null;
}

export class CompanyFolderBreadcrumbDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class CompanyFolderContentsResponseDto {
  @ApiProperty({ format: 'uuid' })
  companyId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  folderId: string | null;

  @ApiProperty({ type: [CompanyFolderBreadcrumbDto] })
  breadcrumb: CompanyFolderBreadcrumbDto[];

  @ApiProperty({ type: [CompanyFolderResponseDto] })
  folders: CompanyFolderResponseDto[];

  @ApiProperty({ type: [CompanyFileResponseDto] })
  files: CompanyFileResponseDto[];
}

export class CompanyFileDownloadResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  expiresInSeconds: number;
}
