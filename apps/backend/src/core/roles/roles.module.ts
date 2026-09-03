import { Module } from '@nestjs/common';
import { StatusesModule } from '../statuses/statuses.module';
import { PermissionsService } from './application/permissions.service';
import { RolesService } from './application/roles.service';
import { PermissionsGuard } from './infrastructure/permissions.guard';
import { RolesRepository } from './infrastructure/roles.repository';
import { RoleAssignmentsController } from './presentation/role-assignments.controller';
import { RolesController } from './presentation/roles.controller';

@Module({
  imports: [StatusesModule],
  controllers: [RolesController, RoleAssignmentsController],
  providers: [
    RolesRepository,
    RolesService,
    PermissionsService,
    PermissionsGuard,
  ],
  exports: [
    RolesRepository,
    RolesService,
    PermissionsService,
    PermissionsGuard,
  ],
})
export class RolesModule {}
