import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../auth/infrastructure/current-user.decorator';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { RolesService } from '../application/roles.service';
import { PermissionsGuard } from '../infrastructure/permissions.guard';
import { CreateRoleAssignmentDto } from './dto/create-role-assignment.dto';
import { RequirePermission } from './require-permission.decorator';

@ApiTags('role-assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('role-assignments')
export class RoleAssignmentsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('roles:read')
  findByUser(
    @CurrentUserId() callerUserId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.rolesService.findAssignmentsByUser(callerUserId, userId);
  }

  @Post()
  @RequirePermission('roles:assign')
  create(
    @CurrentUserId() callerUserId: number,
    @Body() dto: CreateRoleAssignmentDto,
  ) {
    return this.rolesService.createAssignment(callerUserId, dto);
  }

  @Delete(':id')
  @RequirePermission('roles:revoke')
  remove(
    @CurrentUserId() callerUserId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.rolesService.deleteAssignment(callerUserId, id);
  }
}
