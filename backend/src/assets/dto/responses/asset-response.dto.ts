import { ApiProperty } from '@nestjs/swagger';

export class AssetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'contrato.pdf' })
  fileName: string;

  @ApiProperty({
    description: 'Object key privado en R2 (no URL pública)',
    example: 'projects/uuid/1710000000000_contrato.pdf',
  })
  filePath: string;

  @ApiProperty({ example: 'application/pdf', nullable: true })
  mimeType: string | null;

  @ApiProperty({ example: 102400, nullable: true })
  fileSize: number | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  uploadedById: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class AssetDownloadUrlResponseDto {
  @ApiProperty({ description: 'URL firmada temporal para descarga' })
  url: string;

  @ApiProperty({ example: 300 })
  expiresInSeconds: number;
}
