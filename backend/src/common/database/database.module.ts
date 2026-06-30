import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../../companies/entities/company.entity';
import { LegalRepresentative } from '../../companies/entities/legal-representative.entity';
import { CompanyRepresentative } from '../../companies/entities/company-representative.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ??
        'postgresql://mia_user:changeme_dev_only@bd_main:5432/mia_system',
      entities: [Company, LegalRepresentative, CompanyRepresentative],
      synchronize: false,
    }),
  ],
})
export class DatabaseModule {}
