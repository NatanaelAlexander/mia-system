import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TicketsRealtimeService } from './realtime/tickets-realtime.service';
import {
  InternalTicketsController,
  PortalTicketsController,
} from './tickets.controller';
import { TicketsGateway } from './tickets.gateway';
import { TicketsService } from './tickets.service';

@Module({
  imports: [AuthModule, AuditModule, ProjectsModule, AssetsModule, NotificationsModule],
  controllers: [InternalTicketsController, PortalTicketsController],
  providers: [
    TicketsService,
    TicketsGateway,
    TicketsRealtimeService,
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
