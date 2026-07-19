import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  PriceInputMode,
  QuoteDocumentType,
  QuoteFrequency,
  QuoteScope,
  QuoteStatus,
} from '../types/quote.types';

export class QuoteLineItemDto {
  @ApiProperty({ example: 'Desarrollo ERP' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Módulo de facturación' })
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ example: 1000000 })
  @IsNumber()
  price: number;
}

export class QuoteSectionDto {
  @ApiProperty({ enum: QuoteFrequency })
  @IsEnum(QuoteFrequency)
  frequency: QuoteFrequency;

  @ApiProperty({ default: false })
  @IsBoolean()
  esCanje: boolean;

  @ApiProperty({
    description: 'IVA (factura) o retención (boleta)',
    default: false,
  })
  @IsBoolean()
  applyTax: boolean;

  @ApiPropertyOptional({
    enum: PriceInputMode,
    description: 'Solo boleta con retención: gross = bruto, liquid = líquido deseado',
  })
  @IsOptional()
  @IsEnum(PriceInputMode)
  priceInputMode?: PriceInputMode;

  @ApiProperty({ type: [QuoteLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineItemDto)
  items: QuoteLineItemDto[];
}

export class CreateQuoteDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  companyId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  legalRepresentativeId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  issuerId: string;

  @ApiProperty({ enum: QuoteScope })
  @IsEnum(QuoteScope)
  scope: QuoteScope;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  projectId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  ticketId?: string | null;

  @ApiProperty({ enum: QuoteDocumentType })
  @IsEnum(QuoteDocumentType)
  documentType: QuoteDocumentType;

  @ApiPropertyOptional({
    enum: ['clasico', 'tarjetas', 'minimal', 'editorial', 'informe', 'banner', 'dual'],
    default: 'clasico',
  })
  @IsOptional()
  @IsString()
  @IsIn(['clasico', 'tarjetas', 'minimal', 'editorial', 'informe', 'banner', 'dual'])
  pdfLayoutId?: string;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/)
  pdfPrimaryColor?: string;

  @ApiPropertyOptional({ example: '#6B7280' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/)
  pdfSecondaryColor?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  clientVisible: boolean;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional({
    example: '2026-08-14',
    description: 'Si se omite, issueDate + 30 días',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ enum: QuoteStatus, default: QuoteStatus.DRAFT })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional({
    example: 'creado',
    description:
      'Estado comercial único. Si se omite, se asigna «creado».',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  statusCode?: string;

  @ApiProperty({ type: [QuoteSectionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteSectionDto)
  sections: QuoteSectionDto[];
}

export class UpdateQuoteDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  legalRepresentativeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  issuerId?: string;

  @ApiPropertyOptional({ enum: QuoteScope })
  @IsOptional()
  @IsEnum(QuoteScope)
  scope?: QuoteScope;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  projectId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  ticketId?: string | null;

  @ApiPropertyOptional({ enum: QuoteDocumentType })
  @IsOptional()
  @IsEnum(QuoteDocumentType)
  documentType?: QuoteDocumentType;

  @ApiPropertyOptional({
    enum: ['clasico', 'tarjetas', 'minimal', 'editorial', 'informe', 'banner', 'dual'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['clasico', 'tarjetas', 'minimal', 'editorial', 'informe', 'banner', 'dual'])
  pdfLayoutId?: string;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/)
  pdfPrimaryColor?: string;

  @ApiPropertyOptional({ example: '#6B7280' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/)
  pdfSecondaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clientVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ enum: QuoteStatus })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional({
    example: 'creado',
    description: 'Estado comercial único (reemplaza el actual si se envía).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  statusCode?: string;

  @ApiPropertyOptional({ type: [QuoteSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteSectionDto)
  sections?: QuoteSectionDto[];
}

export class FilterQuotesDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  companyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  projectId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  ticketId?: string;

  @ApiPropertyOptional({ enum: QuoteStatus })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional({
    description: 'Código de estado del catálogo (enviado, pagado, etc.)',
    example: 'pagado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  statusCode?: string;

  @ApiPropertyOptional({ enum: QuoteDocumentType })
  @IsOptional()
  @IsEnum(QuoteDocumentType)
  documentType?: QuoteDocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clientVisible?: boolean;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Filtrar por fecha de emisión desde (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  issueDateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Filtrar por fecha de emisión hasta (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  issueDateTo?: string;
}

export class ToggleShareDto {
  @ApiProperty({ description: 'true = habilitar (reinicia 24h), false = deshabilitar' })
  @IsBoolean()
  enabled: boolean;
}

export class SetQuoteStatusesDto {
  @ApiProperty({
    description: 'Código del único estado comercial activo',
    example: 'pendiente_pago',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  statusCode: string;
}

export class UploadSignedDocumentDto {
  @ApiPropertyOptional({
    description: 'Nombre visible opcional del archivo firmado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;
}
