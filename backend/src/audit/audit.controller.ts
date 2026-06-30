import { Body, Controller, Get } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FindByIdDto } from '../common/dto/find-by-id.dto';
import { AuditService } from './audit.service';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';
import { AuditLogResponseDto } from './dto/responses/audit-log-response.dto';

@ApiTags('Audit — Internal')
@Controller('internal/audit-logs')
export class InternalAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar registros de auditoría',
    description:
      'Filtros opcionales por body. Sin body lista los últimos 50.',
  })
  @ApiBody({ type: FilterAuditLogsDto, required: false })
  @ApiOkResponse({ type: AuditLogResponseDto, isArray: true })
  findAll(@Body() filters: FilterAuditLogsDto = {}) {
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
