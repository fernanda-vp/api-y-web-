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
import { JobTitlesService } from '../application/job-titles.service';
import { CreateJobTitleDto } from './dto/create-job-title.dto';
import { FindJobTitlesQueryDto } from './dto/find-job-titles-query.dto';
import { UpdateJobTitleDto } from './dto/update-job-title.dto';

@ApiTags('job-titles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('job-titles')
export class JobTitlesController {
  constructor(private readonly jobTitlesService: JobTitlesService) {}

  @Post()
  @RequirePermission('job-titles:create')
  create(@CurrentUserId() userId: number, @Body() dto: CreateJobTitleDto) {
    return this.jobTitlesService.create(userId, dto.name, dto.parentJobTitleId);
  }

  @Get()
  @RequirePermission('job-titles:read')
  findAll(
    @CurrentUserId() userId: number,
    @Query() query: FindJobTitlesQueryDto,
  ) {
    return this.jobTitlesService.findAll(userId, query);
  }

  // Declarado antes de ':id' — de lo contrario "tree" se interpretaría como un id.
  @Get('tree')
  @RequirePermission('job-titles:read')
  tree() {
    return this.jobTitlesService.tree();
  }

  @Get(':id')
  @RequirePermission('job-titles:read')
  findOne(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobTitlesService.findById(userId, id);
  }

  @Patch(':id')
  @RequirePermission('job-titles:update')
  update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobTitleDto,
  ) {
    return this.jobTitlesService.update(userId, id, dto);
  }

  @Patch(':id/enable')
  @RequirePermission('job-titles:enable')
  enable(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobTitlesService.enable(userId, id);
  }

  @Patch(':id/disable')
  @RequirePermission('job-titles:disable')
  disable(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobTitlesService.disable(userId, id);
  }
}
