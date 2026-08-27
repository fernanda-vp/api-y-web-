import { Module } from '@nestjs/common';
import { StatusesRepository } from './infrastructure/statuses.repository';
import { StatusesService } from './application/statuses.service';

@Module({
  providers: [StatusesRepository, StatusesService],
  exports: [StatusesService],
})
export class StatusesModule {}
