import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { NotificationsRealtimeService } from './realtime/notifications-realtime.service';
import {
  InternalNotificationsController,
  PortalNotificationsController,
} from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule, ScheduleModule.forRoot()],
  controllers: [InternalNotificationsController, PortalNotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationsRealtimeService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
