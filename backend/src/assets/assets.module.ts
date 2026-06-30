import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssetsService } from './assets.service';
import { InternalAssetsController } from './assets.controller';

@Module({
  imports: [AuthModule],
  controllers: [InternalAssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
