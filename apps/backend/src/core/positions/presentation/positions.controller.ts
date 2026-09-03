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
import { PositionsService } from '../application/positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { EndPositionDto } from './dto/end-position.dto';
import { FindPositionsQueryDto } from './dto/find-positions-query.dto';
import { TransferPositionDto } from './dto/transfer-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@ApiTags('positions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @RequirePermission('positions:create')
  create(@CurrentUserId() userId: number, @Body() dto: CreatePositionDto) {
    return this.positionsService.create(userId, dto);
  }

  @Get()
  @RequirePermission('positions:read')
  findAll(
    @CurrentUserId() userId: number,
    @Query() query: FindPositionsQueryDto,
  ) {
    return this.positionsService.findAll(userId, query);
  }

  @Get(':id')
  @RequirePermission('positions:read')
  findOne(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.positionsService.findByIdWithManagerResolution(userId, id);
  }

  @Patch(':id')
  @RequirePermission('positions:update')
  update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.positionsService.update(userId, id, dto);
  }

  @Patch(':id/end')
  @RequirePermission('positions:end')
  end(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndPositionDto,
  ) {
    return this.positionsService.end(userId, id, dto.effectiveDate);
  }

  @Post(':id/transfer')
  @RequirePermission('positions:transfer')
  transfer(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferPositionDto,
  ) {
    return this.positionsService.transfer(userId, id, dto);
  }
}
