import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PortalAccessModule } from '../common/portal/portal-access.module';
import { AssetsService } from './assets.service';
import {
  InternalAssetsController,
  PortalAssetsController,
} from './assets.controller';

@Module({
  imports: [AuthModule, PortalAccessModule],
  controllers: [InternalAssetsController, PortalAssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
