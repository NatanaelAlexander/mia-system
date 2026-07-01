import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import {
  InternalUserProfileController,
  InternalUsersController,
  PortalUserProfileController,
} from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [
    InternalUserProfileController,
    PortalUserProfileController,
    InternalUsersController,
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
