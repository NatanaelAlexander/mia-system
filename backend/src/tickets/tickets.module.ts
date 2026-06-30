import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import {
  InternalTicketsController,
  PortalTicketsController,
} from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [AuthModule, AuditModule, ProjectsModule, AssetsModule],
  controllers: [InternalTicketsController, PortalTicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
