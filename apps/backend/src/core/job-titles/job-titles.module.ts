import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { StatusesModule } from '../statuses/statuses.module';
import { JobTitlesService } from './application/job-titles.service';
import { JobTitlesRepository } from './infrastructure/job-titles.repository';
import { JobTitlesController } from './presentation/job-titles.controller';

@Module({
  imports: [StatusesModule, RolesModule],
  controllers: [JobTitlesController],
  providers: [JobTitlesRepository, JobTitlesService],
})
export class JobTitlesModule {}
