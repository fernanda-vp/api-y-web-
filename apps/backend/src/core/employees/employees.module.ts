import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { StatusesModule } from '../statuses/statuses.module';
import { EmployeesService } from './application/employees.service';
import { EmployeesRepository } from './infrastructure/employees.repository';
import { EmployeesController } from './presentation/employees.controller';

@Module({
  imports: [StatusesModule, RolesModule],
  controllers: [EmployeesController],
  providers: [EmployeesRepository, EmployeesService],
})
export class EmployeesModule {}
