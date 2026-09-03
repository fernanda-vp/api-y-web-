import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { StatusesModule } from '../statuses/statuses.module';
import { DepartmentsService } from './application/departments.service';
import { DepartmentsRepository } from './infrastructure/departments.repository';
import { DepartmentsController } from './presentation/departments.controller';

@Module({
  imports: [StatusesModule, RolesModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsRepository, DepartmentsService],
})
export class DepartmentsModule {}
