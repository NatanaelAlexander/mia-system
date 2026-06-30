import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import {
  InternalCompaniesController,
  InternalLegalRepresentativesController,
  PortalCompaniesController,
} from './companies.controller';

@Module({
  controllers: [
    InternalCompaniesController,
    InternalLegalRepresentativesController,
    PortalCompaniesController,
  ],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
