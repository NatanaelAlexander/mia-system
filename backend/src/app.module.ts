import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ApiAuthorizationGuard } from './auth/guards/api-authorization.guard';
import { loadSecurityConfig } from './common/security/security.config';
import { DatabaseModule } from './common/database/database.module';
import { PortalAccessModule } from './common/portal/portal-access.module';
import { StorageModule } from './common/storage/storage.module';
import { CompaniesModule } from './companies/companies.module';
import { AssetsModule } from './assets/assets.module';
import { ProjectsModule } from './projects/projects.module';
import { AuditModule } from './audit/audit.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { QuotesModule } from './quotes/quotes.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: loadSecurityConfig().throttleTtlMs,
          limit: loadSecurityConfig().throttleLimit,
        },
      ],
    }),
    DatabaseModule,
    PortalAccessModule,
    StorageModule,
    AuthModule,
    CompaniesModule,
    AssetsModule,
    ProjectsModule,
    AuditModule,
    TicketsModule,
    NotificationsModule,
    UsersModule,
    QuotesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ApiAuthorizationGuard,
    },
  ],
})
export class AppModule {}
