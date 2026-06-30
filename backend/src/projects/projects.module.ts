import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { AuditModule } from '../audit/audit.module';
import { CompaniesModule } from '../companies/companies.module';
import {
  InternalProjectsController,
  PortalProjectsController,
} from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuditModule, CompaniesModule, AssetsModule],
  controllers: [InternalProjectsController, PortalProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
