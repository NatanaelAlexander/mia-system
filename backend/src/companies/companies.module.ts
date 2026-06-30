import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CompaniesService } from './companies.service';
import {
  InternalCompaniesController,
  InternalLegalRepresentativesController,
  PortalCompaniesController,
} from './companies.controller';

@Module({
  imports: [AuditModule],
  controllers: [
    InternalCompaniesController,
    InternalLegalRepresentativesController,
    PortalCompaniesController,
  ],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
