import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { LegalRepresentative } from './entities/legal-representative.entity';
import { CompanyRepresentative } from './entities/company-representative.entity';
import { CompaniesService } from './companies.service';
import {
  InternalCompaniesController,
  InternalLegalRepresentativesController,
  PortalCompaniesController,
} from './companies.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, LegalRepresentative, CompanyRepresentative]),
  ],
  controllers: [
    InternalCompaniesController,
    InternalLegalRepresentativesController,
    PortalCompaniesController,
  ],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
