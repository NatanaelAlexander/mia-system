import { Module } from '@nestjs/common';
import { InternalAuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  controllers: [InternalAuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
