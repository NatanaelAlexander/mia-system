import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { CompaniesService } from './companies.service';
import {
  InternalCompaniesController,
  InternalLegalRepresentativesController,
  PortalCompaniesController,
} from './companies.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [
    InternalCompaniesController,
    InternalLegalRepresentativesController,
    PortalCompaniesController,
  ],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
