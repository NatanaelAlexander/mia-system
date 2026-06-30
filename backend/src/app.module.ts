import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { StorageModule } from './common/storage/storage.module';
import { CompaniesModule } from './companies/companies.module';
import { AssetsModule } from './assets/assets.module';
import { ProjectsModule } from './projects/projects.module';
import { AuditModule } from './audit/audit.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    CompaniesModule,
    AssetsModule,
    ProjectsModule,
    AuditModule,
    TicketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
