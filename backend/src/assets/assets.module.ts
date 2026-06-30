import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { InternalAssetsController } from './assets.controller';

@Module({
  controllers: [InternalAssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
