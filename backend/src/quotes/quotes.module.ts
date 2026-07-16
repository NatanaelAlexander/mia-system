import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { AuditModule } from '../audit/audit.module';
import { CompaniesModule } from '../companies/companies.module';
import {
  InternalQuotesController,
  PublicQuotesController,
} from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [AuthModule, AuditModule, CompaniesModule, AssetsModule],
  controllers: [InternalQuotesController, PublicQuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
