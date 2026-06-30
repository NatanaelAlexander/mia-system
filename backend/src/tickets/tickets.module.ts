import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import {
  InternalTicketsController,
  PortalTicketsController,
} from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [AuditModule, ProjectsModule, AssetsModule],
  controllers: [InternalTicketsController, PortalTicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
