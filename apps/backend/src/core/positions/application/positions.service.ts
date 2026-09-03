import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { buildPaginatedResult } from '../../common/pagination/paginated-result';
import {
  PermissionsService,
  type ScopeTarget,
} from '../../roles/application/permissions.service';
import { StatusesService } from '../../statuses/application/statuses.service';
import { PositionsRepository } from '../infrastructure/positions.repository';
import type { FindPositionsQueryDto } from '../presentation/dto/find-positions-query.dto';

const STATUS_GROUP = 'POSITION';

export interface ManagerResolution {
  source: 'explicit' | 'derived' | 'ambiguous' | 'none';
  position?: unknown;
  candidates?: unknown[];
}

@Injectable()
export class PositionsService {
  constructor(
    private readonly positionsRepository: PositionsRepository,
    private readonly statusesService: StatusesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(
    userId: number,
    input: {
      employeeId: number;
      jobTitleId: number;
      departmentId: number;
      zoneId: number;
      managerPositionId?: number | null;
      functionalManagerPositionId?: number | null;
      startDate?: Date;
    },
  ) {
    const companyId = await this.assertReferencesAreValid(input);
    await this.permissionsService.assertScope(userId, 'positions:create', {
      companyId,
      departmentId: input.departmentId,
      zoneId: input.zoneId,
      jobTitleId: input.jobTitleId,
    });

    if (await this.positionsRepository.hasActivePosition(input.employeeId)) {
      throw new ConflictException(
        `Employee ${input.employeeId} already has an active position — use transfer instead`,
      );
    }

    const activeStatus = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );

    return this.positionsRepository.create({
      employeeId: input.employeeId,
      jobTitleId: input.jobTitleId,
      departmentId: input.departmentId,
      zoneId: input.zoneId,
      managerPositionId: input.managerPositionId ?? null,
      functionalManagerPositionId: input.functionalManagerPositionId ?? null,
      startDate: input.startDate ?? new Date(),
      statusId: activeStatus.id,
    });
  }

  async findAll(userId: number, query: FindPositionsQueryDto) {
    const where: Prisma.PositionWhereInput = {};

    if (query.employeeId !== undefined) where.employeeId = query.employeeId;
    if (query.departmentId !== undefined)
      where.departmentId = query.departmentId;
    if (query.zoneId !== undefined) where.zoneId = query.zoneId;
    if (query.jobTitleId !== undefined) where.jobTitleId = query.jobTitleId;
    if (query.status === 'active') where.endDate = null;
    if (query.status === 'ended') where.endDate = { not: null };

    await this.applyReadScope(userId, where);

    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      this.positionsRepository.findMany(where, skip, query.limit),
      this.positionsRepository.count(where),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async findByIdWithManagerResolution(userId: number, id: number) {
    const position = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(
      userId,
      'positions:read',
      await this.buildScopeTarget(position),
    );
    const managerResolution = await this.resolveManager(position);
    return { ...position, managerResolution };
  }

  async update(
    userId: number,
    id: number,
    data: {
      managerPositionId?: number | null;
      functionalManagerPositionId?: number | null;
    },
  ) {
    const position = await this.getByIdOrThrow(id);
    const scopeTarget = await this.buildScopeTarget(position);
    await this.permissionsService.assertScope(
      userId,
      'positions:update',
      scopeTarget,
    );

    if (scopeTarget.companyId === undefined) {
      throw new BadRequestException(
        `Department ${position.departmentId} not found`,
      );
    }

    if (
      data.managerPositionId !== undefined &&
      data.managerPositionId !== null
    ) {
      await this.assertManagerPositionValid(
        data.managerPositionId,
        scopeTarget.companyId,
        'Manager position',
      );
    }
    if (
      data.functionalManagerPositionId !== undefined &&
      data.functionalManagerPositionId !== null
    ) {
      await this.assertManagerPositionValid(
        data.functionalManagerPositionId,
        scopeTarget.companyId,
        'Functional manager position',
      );
    }

    return this.positionsRepository.update(id, data);
  }

  async transfer(
    userId: number,
    id: number,
    input: {
      jobTitleId: number;
      departmentId: number;
      zoneId: number;
      managerPositionId?: number | null;
      functionalManagerPositionId?: number | null;
      effectiveDate?: Date;
    },
  ) {
    const current = await this.getByIdOrThrow(id);
    this.assertIsActive(current);
    // Autorización sobre la posición actual — transferir es "cerrar esta y abrir una nueva".
    await this.permissionsService.assertScope(
      userId,
      'positions:transfer',
      await this.buildScopeTarget(current),
    );
    await this.assertReferencesAreValid({
      ...input,
      employeeId: current.employeeId,
    });

    const effectiveDate = input.effectiveDate ?? new Date();
    const [endedStatus, activeStatus] = await Promise.all([
      this.statusesService.getRequired(STATUS_GROUP, 'ENDED'),
      this.statusesService.getRequired(STATUS_GROUP, 'ACTIVE'),
    ]);

    return this.positionsRepository.transferAtomically(
      id,
      effectiveDate,
      endedStatus.id,
      {
        employeeId: current.employeeId,
        jobTitleId: input.jobTitleId,
        departmentId: input.departmentId,
        zoneId: input.zoneId,
        managerPositionId: input.managerPositionId ?? null,
        functionalManagerPositionId: input.functionalManagerPositionId ?? null,
        startDate: effectiveDate,
        statusId: activeStatus.id,
      },
    );
  }

  async end(userId: number, id: number, effectiveDate?: Date) {
    const current = await this.getByIdOrThrow(id);
    this.assertIsActive(current);
    await this.permissionsService.assertScope(
      userId,
      'positions:end',
      await this.buildScopeTarget(current),
    );

    const endedStatus = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ENDED',
    );
    return this.positionsRepository.close(
      id,
      effectiveDate ?? new Date(),
      endedStatus.id,
    );
  }

  private assertIsActive(position: { endDate: Date | null }) {
    if (position.endDate !== null) {
      throw new BadRequestException('This position has already ended');
    }
  }

  private async getByIdOrThrow(id: number) {
    const position = await this.positionsRepository.findById(id);
    if (!position) {
      throw new NotFoundException(`Position ${id} not found`);
    }
    return position;
  }

  private async buildScopeTarget(position: {
    departmentId: number;
    zoneId: number;
    jobTitleId: number;
  }): Promise<ScopeTarget> {
    const companyId = await this.positionsRepository.getDepartmentCompanyId(
      position.departmentId,
    );
    return {
      companyId,
      departmentId: position.departmentId,
      zoneId: position.zoneId,
      jobTitleId: position.jobTitleId,
    };
  }

  private async applyReadScope(
    userId: number,
    where: Prisma.PositionWhereInput,
  ): Promise<void> {
    const grant = await this.permissionsService.getScopeGrant(
      userId,
      'positions:read',
    );
    if (grant.global) return;

    const scopeOr: Prisma.PositionWhereInput[] = [];
    if (grant.companyIds.length > 0) {
      scopeOr.push({ department: { companyId: { in: grant.companyIds } } });
    }
    if (grant.zoneIds.length > 0)
      scopeOr.push({ zoneId: { in: grant.zoneIds } });
    if (grant.departmentIds.length > 0)
      scopeOr.push({ departmentId: { in: grant.departmentIds } });
    if (grant.jobTitleIds.length > 0)
      scopeOr.push({ jobTitleId: { in: grant.jobTitleIds } });

    if (scopeOr.length === 0) {
      where.id = { in: [] };
    } else {
      where.AND = [{ OR: scopeOr }];
    }
  }

  private async resolveManager(position: {
    jobTitleId: number;
    departmentId: number;
    managerPositionId: number | null;
  }): Promise<ManagerResolution> {
    if (position.managerPositionId !== null) {
      const explicit = await this.positionsRepository.findById(
        position.managerPositionId,
      );
      return { source: 'explicit', position: explicit };
    }

    const parentJobTitleId = await this.positionsRepository.getJobTitleParentId(
      position.jobTitleId,
    );
    if (!parentJobTitleId) {
      return { source: 'none' };
    }

    const candidates = await this.positionsRepository.findActiveCandidates(
      parentJobTitleId,
      position.departmentId,
    );

    if (candidates.length === 0) {
      return { source: 'none' };
    }
    if (candidates.length === 1) {
      return { source: 'derived', position: candidates[0] };
    }
    return { source: 'ambiguous', candidates };
  }

  /** Valida las referencias de entrada y devuelve el companyId compartido por department/zone. */
  private async assertReferencesAreValid(input: {
    employeeId: number;
    jobTitleId: number;
    departmentId: number;
    zoneId: number;
    managerPositionId?: number | null;
    functionalManagerPositionId?: number | null;
  }): Promise<number> {
    if (!(await this.positionsRepository.employeeExists(input.employeeId))) {
      throw new BadRequestException(`Employee ${input.employeeId} not found`);
    }

    const jobTitleParentId = await this.positionsRepository.getJobTitleParentId(
      input.jobTitleId,
    );
    if (jobTitleParentId === undefined) {
      throw new BadRequestException(`Job title ${input.jobTitleId} not found`);
    }

    const departmentCompanyId =
      await this.positionsRepository.getDepartmentCompanyId(input.departmentId);
    if (departmentCompanyId === undefined) {
      throw new BadRequestException(
        `Department ${input.departmentId} not found`,
      );
    }

    const zoneCompanyId = await this.positionsRepository.getZoneCompanyId(
      input.zoneId,
    );
    if (zoneCompanyId === undefined) {
      throw new BadRequestException(`Zone ${input.zoneId} not found`);
    }

    if (departmentCompanyId !== zoneCompanyId) {
      throw new BadRequestException(
        'Department and zone must belong to the same company',
      );
    }

    if (input.managerPositionId) {
      await this.assertManagerPositionValid(
        input.managerPositionId,
        departmentCompanyId,
        'Manager position',
      );
    }
    if (input.functionalManagerPositionId) {
      await this.assertManagerPositionValid(
        input.functionalManagerPositionId,
        departmentCompanyId,
        'Functional manager position',
      );
    }

    return departmentCompanyId;
  }

  /** Existe y pertenece a la misma empresa que la posición que lo referencia — un jefe no puede ser de otra empresa. */
  private async assertManagerPositionValid(
    id: number,
    expectedCompanyId: number,
    label: string,
  ) {
    const position = await this.positionsRepository.findById(id);
    if (!position) {
      throw new BadRequestException(`${label} ${id} not found`);
    }
    if (position.department.companyId !== expectedCompanyId) {
      throw new BadRequestException(`${label} must belong to the same company`);
    }
  }
}
