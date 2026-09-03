import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { buildTree, findCycleConflict } from '../../common/hierarchy/tree.util';
import { buildPaginatedResult } from '../../common/pagination/paginated-result';
import { PermissionsService } from '../../roles/application/permissions.service';
import { StatusesService } from '../../statuses/application/statuses.service';
import { DepartmentsRepository } from '../infrastructure/departments.repository';
import type { FindDepartmentsQueryDto } from '../presentation/dto/find-departments-query.dto';

const STATUS_GROUP = 'DEPARTMENT';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly statusesService: StatusesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(
    userId: number,
    companyId: number,
    name: string,
    parentDepartmentId?: number,
  ) {
    await this.permissionsService.assertScope(userId, 'departments:create', {
      companyId,
    });

    const companyExists =
      await this.departmentsRepository.companyExists(companyId);
    if (!companyExists) {
      throw new BadRequestException(`Company ${companyId} not found`);
    }

    if (parentDepartmentId !== undefined) {
      await this.assertParentBelongsToCompany(parentDepartmentId, companyId);
    }

    const activeStatus = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.departmentsRepository.create({
      companyId,
      name,
      parentDepartmentId: parentDepartmentId ?? null,
      statusId: activeStatus.id,
    });
  }

  async findAll(userId: number, query: FindDepartmentsQueryDto) {
    const where: Prisma.DepartmentWhereInput = {};

    if (query.companyId !== undefined) {
      where.companyId = query.companyId;
    }
    if (query.parentDepartmentId !== undefined) {
      where.parentDepartmentId = query.parentDepartmentId;
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
      this.departmentsRepository.findMany(where, skip, query.limit),
      this.departmentsRepository.count(where),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  /**
   * El árbol se trae completo (sin paginar) para una empresa — el chequeo de
   * alcance es a nivel de empresa, no se filtran nodos individuales del árbol
   * (eso rompería la estructura padre/hijo si un nodo intermedio quedara
   * fuera de alcance pero sus hijos no).
   */
  async tree(userId: number, companyId: number) {
    await this.permissionsService.assertScope(userId, 'departments:read', {
      companyId,
    });

    const companyExists =
      await this.departmentsRepository.companyExists(companyId);
    if (!companyExists) {
      throw new BadRequestException(`Company ${companyId} not found`);
    }

    const all = await this.departmentsRepository.findAllByCompany(companyId);
    return buildTree(
      all.map((department) => ({
        ...department,
        parentId: department.parentDepartmentId,
      })),
    );
  }

  async findById(userId: number, id: number) {
    const department = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'departments:read', {
      companyId: department.companyId,
      departmentId: department.id,
    });
    return department;
  }

  async update(
    userId: number,
    id: number,
    data: { name?: string; parentDepartmentId?: number | null },
  ) {
    const department = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'departments:update', {
      companyId: department.companyId,
      departmentId: department.id,
    });

    if (
      data.parentDepartmentId !== undefined &&
      data.parentDepartmentId !== null
    ) {
      await this.assertParentBelongsToCompany(
        data.parentDepartmentId,
        department.companyId,
      );

      const all = await this.departmentsRepository.findAllByCompany(
        department.companyId,
      );
      const conflict = findCycleConflict(
        all.map((d) => ({ id: d.id, parentId: d.parentDepartmentId })),
        id,
        data.parentDepartmentId,
      );
      if (conflict) {
        throw new BadRequestException(conflict);
      }
    }

    return this.departmentsRepository.update(id, data);
  }

  async enable(userId: number, id: number) {
    const department = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'departments:enable', {
      companyId: department.companyId,
      departmentId: department.id,
    });
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.departmentsRepository.setStatus(id, status.id);
  }

  async disable(userId: number, id: number) {
    const department = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'departments:disable', {
      companyId: department.companyId,
      departmentId: department.id,
    });
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'INACTIVE',
    );
    return this.departmentsRepository.setStatus(id, status.id);
  }

  private async getByIdOrThrow(id: number) {
    const department = await this.departmentsRepository.findById(id);
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    return department;
  }

  private async assertParentBelongsToCompany(
    parentDepartmentId: number,
    companyId: number,
  ) {
    const parent =
      await this.departmentsRepository.findById(parentDepartmentId);
    if (!parent || parent.companyId !== companyId) {
      throw new BadRequestException(
        `Parent department ${parentDepartmentId} not found in company ${companyId}`,
      );
    }
  }

  private async applyReadScope(
    userId: number,
    where: Prisma.DepartmentWhereInput,
  ): Promise<void> {
    const grant = await this.permissionsService.getScopeGrant(
      userId,
      'departments:read',
    );
    if (grant.global) return;

    const scopeOr: Prisma.DepartmentWhereInput[] = [];
    if (grant.companyIds.length > 0)
      scopeOr.push({ companyId: { in: grant.companyIds } });
    if (grant.departmentIds.length > 0)
      scopeOr.push({ id: { in: grant.departmentIds } });

    if (scopeOr.length === 0) {
      where.id = { in: [] };
    } else {
      where.AND = [{ OR: scopeOr }];
    }
  }
}
