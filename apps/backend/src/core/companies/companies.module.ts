import { Module } from '@nestjs/common';
import { StatusesModule } from '../statuses/statuses.module';
import { CompaniesService } from './application/companies.service';
import { CompaniesRepository } from './infrastructure/companies.repository';
import { CompaniesController } from './presentation/companies.controller';

@Module({
  imports: [StatusesModule],
  controllers: [CompaniesController],
  providers: [CompaniesRepository, CompaniesService],
})
export class CompaniesModule {}
