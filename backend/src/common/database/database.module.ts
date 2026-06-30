import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../../companies/entities/company.entity';
import { LegalRepresentative } from '../../companies/entities/legal-representative.entity';
import { CompanyRepresentative } from '../../companies/entities/company-representative.entity';
import { resolveDatabaseUrl } from './database-url';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: resolveDatabaseUrl(),
      entities: [Company, LegalRepresentative, CompanyRepresentative],
      synchronize: false,
    }),
  ],
})
export class DatabaseModule {}
