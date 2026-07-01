import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class GetTicketCommentsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;
}

export class GetTicketStatusHistoryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;
}

export class GetTicketAssetsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;
}

export class GetCommentAssetsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del comentario no es válido' })
  ticketCommentId: string;
}

export class LinkTicketAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del archivo no es válido' })
  assetId: string;
}

export class UnlinkTicketAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del archivo no es válido' })
  assetId: string;
}

export class LinkCommentAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del comentario no es válido' })
  ticketCommentId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del archivo no es válido' })
  assetId: string;
}

export class UnlinkCommentAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del comentario no es válido' })
  ticketCommentId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del archivo no es válido' })
  assetId: string;
}

export class UploadTicketAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ticket no es válido' })
  ticketId: string;

  @ApiPropertyOptional({
    description: 'Nombre visible opcional. Sin valor usa el nombre original del archivo.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;
}

export class UploadCommentAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'El ID del comentario no es válido' })
  ticketCommentId: string;

  @ApiPropertyOptional({
    description: 'Nombre visible opcional. Sin valor usa el nombre original del archivo.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;
}
