import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { RolesService } from '../application/roles.service';
import { PermissionsGuard } from '../infrastructure/permissions.guard';
import { BulkSetPermissionsDto } from './dto/bulk-set-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { GrantPermissionDto } from './dto/grant-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RequirePermission } from './require-permission.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @RequirePermission('roles:read')
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get('permissions')
  @RequirePermission('roles:read')
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post('roles')
  @RequirePermission('roles:create')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto.name);
  }

  @Patch('roles/:id')
  @RequirePermission('roles:update')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, dto.name);
  }

  @Patch('roles/:id/enable')
  @RequirePermission('roles:enable')
  enableRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.enableRole(id);
  }

  @Patch('roles/:id/disable')
  @RequirePermission('roles:disable')
  disableRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.disableRole(id);
  }

  @Post('roles/:id/permissions')
  @RequirePermission('roles:manage-permissions')
  grantPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GrantPermissionDto,
  ) {
    return this.rolesService.grantPermission(id, dto.permissionId);
  }

  @Delete('roles/:id/permissions/:permissionId')
  @RequirePermission('roles:manage-permissions')
  revokePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolesService.revokePermission(id, permissionId);
  }

  @Patch('roles/:id/permissions/bulk')
  @RequirePermission('roles:manage-permissions')
  bulkSetPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BulkSetPermissionsDto,
  ) {
    return this.rolesService.bulkSetPermissions(
      id,
      dto.permissionIds,
      dto.grant,
    );
  }
}
