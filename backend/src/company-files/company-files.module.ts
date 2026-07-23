import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { InternalCompanyFilesController } from './company-files.controller';
import { CompanyFilesService } from './company-files.service';

@Module({
  imports: [AuthModule, AssetsModule],
  controllers: [InternalCompanyFilesController],
  providers: [CompanyFilesService],
  exports: [CompanyFilesService],
})
export class CompanyFilesModule {}
