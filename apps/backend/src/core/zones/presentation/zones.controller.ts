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
import { ZonesService } from '../application/zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { FindZonesQueryDto } from './dto/find-zones-query.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@ApiTags('zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  @RequirePermission('zones:create')
  create(@CurrentUserId() userId: number, @Body() dto: CreateZoneDto) {
    return this.zonesService.create(
      userId,
      dto.companyId,
      dto.name,
      dto.address,
    );
  }

  @Get()
  @RequirePermission('zones:read')
  findAll(@CurrentUserId() userId: number, @Query() query: FindZonesQueryDto) {
    return this.zonesService.findAll(userId, query);
  }

  @Get(':id')
  @RequirePermission('zones:read')
  findOne(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.zonesService.findById(userId, id);
  }

  @Patch(':id')
  @RequirePermission('zones:update')
  update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.zonesService.update(userId, id, dto);
  }

  @Patch(':id/enable')
  @RequirePermission('zones:enable')
  enable(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.zonesService.enable(userId, id);
  }

  @Patch(':id/disable')
  @RequirePermission('zones:disable')
  disable(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.zonesService.disable(userId, id);
  }
}
