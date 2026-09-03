import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { StatusesModule } from '../statuses/statuses.module';
import { ZonesService } from './application/zones.service';
import { ZonesRepository } from './infrastructure/zones.repository';
import { ZonesController } from './presentation/zones.controller';

@Module({
  imports: [StatusesModule, RolesModule],
  controllers: [ZonesController],
  providers: [ZonesRepository, ZonesService],
})
export class ZonesModule {}
