import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { StorageModule } from './common/storage/storage.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [DatabaseModule, StorageModule, CompaniesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
