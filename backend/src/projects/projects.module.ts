import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { CompaniesModule } from '../companies/companies.module';
import {
  InternalProjectsController,
  PortalProjectsController,
} from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [CompaniesModule, AssetsModule],
  controllers: [InternalProjectsController, PortalProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
