import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../auth/infrastructure/current-user.decorator';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { PermissionsGuard } from '../../roles/infrastructure/permissions.guard';
import { RequirePermission } from '../../roles/presentation/require-permission.decorator';
import { DepartmentsService } from '../application/departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { FindDepartmentsQueryDto } from './dto/find-departments-query.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @RequirePermission('departments:create')
  create(@CurrentUserId() userId: number, @Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(
      userId,
      dto.companyId,
      dto.name,
      dto.parentDepartmentId,
    );
  }

  @Get()
  @RequirePermission('departments:read')
  findAll(
    @CurrentUserId() userId: number,
    @Query() query: FindDepartmentsQueryDto,
  ) {
    return this.departmentsService.findAll(userId, query);
  }

  // Declarado antes de ':id' — de lo contrario "tree" se interpretaría como un id.
  @Get('tree')
  @RequirePermission('departments:read')
  tree(
    @CurrentUserId() userId: number,
    @Query('companyId', ParseIntPipe) companyId: number,
  ) {
    return this.departmentsService.tree(userId, companyId);
  }

  @Get(':id')
  @RequirePermission('departments:read')
  findOne(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.departmentsService.findById(userId, id);
  }

  @Patch(':id')
  @RequirePermission('departments:update')
  update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(userId, id, dto);
  }

  @Patch(':id/enable')
  @RequirePermission('departments:enable')
  enable(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.departmentsService.enable(userId, id);
  }

  @Patch(':id/disable')
  @RequirePermission('departments:disable')
  disable(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.departmentsService.disable(userId, id);
  }
}
