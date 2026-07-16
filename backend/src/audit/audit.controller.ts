import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthorizeAction,
  AuthorizeResource,
  AuthorizeSurface,
} from '../auth/decorators/authorize.decorator';
import { FindByIdDto } from '../common/dto/find-by-id.dto';
import { AuditService } from './audit.service';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';
import {
  AuditLogResponseDto,
  PaginatedAuditLogsResponseDto,
} from './dto/responses/audit-log-response.dto';

@ApiBearerAuth('access-token')
@AuthorizeSurface('internal')
@AuthorizeResource('audit_logs')
@ApiTags('Audit — Internal')
@Controller('internal/audit-logs')
export class InternalAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar registros de auditoría',
    description:
      'Filtros opcionales por body (acción, fecha, usuario). Paginado; por defecto página 1 con 20 registros.',
  })
  @ApiBody({ type: FilterAuditLogsDto, required: false })
  @ApiOkResponse({ type: PaginatedAuditLogsResponseDto })
  findAll(@Body() filters: FilterAuditLogsDto = {}) {
    return this.auditService.findAll(filters);
  }

  @Post('listar')
  @HttpCode(HttpStatus.OK)
  @AuthorizeAction('read')
  @ApiOperation({
    summary: 'Listar registros de auditoría (con filtros en body)',
    description:
      'Filtros opcionales por body (acción, fecha, usuario). Paginado; por defecto página 1 con 20 registros.',
  })
  @ApiBody({ type: FilterAuditLogsDto, required: false })
  @ApiOkResponse({ type: PaginatedAuditLogsResponseDto })
  list(@Body() filters: FilterAuditLogsDto = {}) {
    return this.auditService.findAll(filters);
  }

  @Get('detalle')
  @ApiOperation({ summary: 'Obtener un registro de auditoría por ID' })
  @ApiBody({ type: FindByIdDto })
  @ApiOkResponse({ type: AuditLogResponseDto })
  findOne(@Body() dto: FindByIdDto) {
    return this.auditService.findById(dto.id);
  }
}
