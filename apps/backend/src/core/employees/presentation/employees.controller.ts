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
import { EmployeesService } from '../application/employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { FindEmployeesQueryDto } from './dto/find-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @RequirePermission('employees:create')
  create(@CurrentUserId() userId: number, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(userId, dto);
  }

  @Get()
  @RequirePermission('employees:read')
  findAll(
    @CurrentUserId() userId: number,
    @Query() query: FindEmployeesQueryDto,
  ) {
    return this.employeesService.findAll(userId, query);
  }

  // Declarado antes de ':id' — de lo contrario "me" se interpretaría como un id.
  // Sin @RequirePermission: es autoservicio, deriva del JWT, solo toca el propio perfil.
  @Patch('me')
  updateMyProfile(
    @CurrentUserId() userId: number,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.employeesService.updateMyProfile(userId, dto);
  }

  @Get(':id')
  @RequirePermission('employees:read')
  findOne(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.employeesService.findById(userId, id);
  }

  @Patch(':id')
  @RequirePermission('employees:update')
  update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(userId, id, dto);
  }

  @Patch(':id/activate')
  @RequirePermission('employees:activate')
  activate(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.employeesService.activate(userId, id);
  }

  @Patch(':id/deactivate')
  @RequirePermission('employees:deactivate')
  deactivate(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.employeesService.deactivate(userId, id);
  }

  @Patch(':id/terminate')
  @RequirePermission('employees:terminate')
  terminate(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.employeesService.terminate(userId, id);
  }
}
