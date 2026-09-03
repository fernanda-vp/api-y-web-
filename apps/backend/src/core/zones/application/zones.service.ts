import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { buildPaginatedResult } from '../../common/pagination/paginated-result';
import { PermissionsService } from '../../roles/application/permissions.service';
import { StatusesService } from '../../statuses/application/statuses.service';
import { ZonesRepository } from '../infrastructure/zones.repository';
import type { FindZonesQueryDto } from '../presentation/dto/find-zones-query.dto';

const STATUS_GROUP = 'ZONE';

@Injectable()
export class ZonesService {
  constructor(
    private readonly zonesRepository: ZonesRepository,
    private readonly statusesService: StatusesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(
    userId: number,
    companyId: number,
    name: string,
    address: string,
  ) {
    await this.permissionsService.assertScope(userId, 'zones:create', {
      companyId,
    });

    const companyExists = await this.zonesRepository.companyExists(companyId);
    if (!companyExists) {
      throw new BadRequestException(`Company ${companyId} not found`);
    }

    const activeStatus = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.zonesRepository.create({
      companyId,
      name,
      address,
      statusId: activeStatus.id,
    });
  }

  async findAll(userId: number, query: FindZonesQueryDto) {
    const where: Prisma.ZoneWhereInput = {};

    if (query.companyId !== undefined) {
      where.companyId = query.companyId;
    }

    if (query.status) {
      const status = await this.statusesService.getRequired(
        STATUS_GROUP,
        query.status.toUpperCase(),
      );
      where.statusId = status.id;
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    await this.applyReadScope(userId, where);

    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      this.zonesRepository.findMany(where, skip, query.limit),
      this.zonesRepository.count(where),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async findById(userId: number, id: number) {
    const zone = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'zones:read', {
      companyId: zone.companyId,
    });
    return zone;
  }

  async update(
    userId: number,
    id: number,
    data: { name?: string; address?: string },
  ) {
    const zone = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'zones:update', {
      companyId: zone.companyId,
    });
    return this.zonesRepository.update(id, data);
  }

  async enable(userId: number, id: number) {
    const zone = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'zones:enable', {
      companyId: zone.companyId,
    });
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.zonesRepository.setStatus(id, status.id);
  }

  async disable(userId: number, id: number) {
    const zone = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'zones:disable', {
      companyId: zone.companyId,
    });
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'INACTIVE',
    );
    return this.zonesRepository.setStatus(id, status.id);
  }

  private async getByIdOrThrow(id: number) {
    const zone = await this.zonesRepository.findById(id);
    if (!zone) {
      throw new NotFoundException(`Zone ${id} not found`);
    }
    return zone;
  }

  private async applyReadScope(
    userId: number,
    where: Prisma.ZoneWhereInput,
  ): Promise<void> {
    const grant = await this.permissionsService.getScopeGrant(
      userId,
      'zones:read',
    );
    if (grant.global) return;

    const scopeOr: Prisma.ZoneWhereInput[] = [];
    if (grant.companyIds.length > 0)
      scopeOr.push({ companyId: { in: grant.companyIds } });
    if (grant.zoneIds.length > 0) scopeOr.push({ id: { in: grant.zoneIds } });

    if (scopeOr.length === 0) {
      where.id = { in: [] };
    } else {
      where.AND = [{ OR: scopeOr }];
    }
  }
}
