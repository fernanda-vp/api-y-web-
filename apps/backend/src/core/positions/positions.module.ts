import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { StatusesModule } from '../statuses/statuses.module';
import { PositionsService } from './application/positions.service';
import { PositionsRepository } from './infrastructure/positions.repository';
import { PositionsController } from './presentation/positions.controller';

@Module({
  imports: [StatusesModule, RolesModule],
  controllers: [PositionsController],
  providers: [PositionsRepository, PositionsService],
})
export class PositionsModule {}
