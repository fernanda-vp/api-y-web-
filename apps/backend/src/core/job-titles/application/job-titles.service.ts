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
import { JobTitlesRepository } from '../infrastructure/job-titles.repository';
import type { FindJobTitlesQueryDto } from '../presentation/dto/find-job-titles-query.dto';

const STATUS_GROUP = 'JOB_TITLE';

@Injectable()
export class JobTitlesService {
  constructor(
    private readonly jobTitlesRepository: JobTitlesRepository,
    private readonly statusesService: StatusesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(userId: number, name: string, parentJobTitleId?: number) {
    // Sin padre = alta de un puesto raíz del catálogo global — requiere alcance GLOBAL.
    // Con padre = requiere alcance sobre ese puesto padre (o alguno de sus ancestros).
    await this.permissionsService.assertScope(
      userId,
      'job-titles:create',
      parentJobTitleId !== undefined ? { jobTitleId: parentJobTitleId } : {},
    );

    if (parentJobTitleId !== undefined) {
      await this.assertParentExists(parentJobTitleId);
    }

    const activeStatus = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.jobTitlesRepository.create({
      name,
      parentJobTitleId: parentJobTitleId ?? null,
      statusId: activeStatus.id,
    });
  }

  async findAll(userId: number, query: FindJobTitlesQueryDto) {
    const where: Prisma.JobTitleWhereInput = {};

    if (query.parentJobTitleId !== undefined) {
      where.parentJobTitleId = query.parentJobTitleId;
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

    const grant = await this.permissionsService.getScopeGrant(
      userId,
      'job-titles:read',
    );
    if (!grant.global) {
      where.id =
        grant.jobTitleIds.length > 0 ? { in: grant.jobTitleIds } : { in: [] };
    }

    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      this.jobTitlesRepository.findMany(where, skip, query.limit),
      this.jobTitlesRepository.count(where),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  /**
   * Catálogo global completo, sin paginar — el Guard ya exige `job-titles:read`
   * en algún alcance; no se filtran nodos individuales (romperia la
   * estructura del árbol si un nodo intermedio quedara fuera de alcance).
   */
  async tree() {
    const all = await this.jobTitlesRepository.findAll();
    return buildTree(
      all.map((jobTitle) => ({
        ...jobTitle,
        parentId: jobTitle.parentJobTitleId,
      })),
    );
  }

  async findById(userId: number, id: number) {
    const jobTitle = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'job-titles:read', {
      jobTitleId: jobTitle.id,
    });
    return jobTitle;
  }

  async update(
    userId: number,
    id: number,
    data: { name?: string; parentJobTitleId?: number | null },
  ) {
    const jobTitle = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'job-titles:update', {
      jobTitleId: jobTitle.id,
    });

    if (data.parentJobTitleId !== undefined && data.parentJobTitleId !== null) {
      await this.assertParentExists(data.parentJobTitleId);

      const all = await this.jobTitlesRepository.findAll();
      const conflict = findCycleConflict(
        all.map((jt) => ({ id: jt.id, parentId: jt.parentJobTitleId })),
        id,
        data.parentJobTitleId,
      );
      if (conflict) {
        throw new BadRequestException(conflict);
      }
    }

    return this.jobTitlesRepository.update(id, data);
  }

  async enable(userId: number, id: number) {
    const jobTitle = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'job-titles:enable', {
      jobTitleId: jobTitle.id,
    });
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.jobTitlesRepository.setStatus(id, status.id);
  }

  async disable(userId: number, id: number) {
    const jobTitle = await this.getByIdOrThrow(id);
    await this.permissionsService.assertScope(userId, 'job-titles:disable', {
      jobTitleId: jobTitle.id,
    });
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'INACTIVE',
    );
    return this.jobTitlesRepository.setStatus(id, status.id);
  }

  private async getByIdOrThrow(id: number) {
    const jobTitle = await this.jobTitlesRepository.findById(id);
    if (!jobTitle) {
      throw new NotFoundException(`JobTitle ${id} not found`);
    }
    return jobTitle;
  }

  private async assertParentExists(parentJobTitleId: number) {
    const parent = await this.jobTitlesRepository.findById(parentJobTitleId);
    if (!parent) {
      throw new BadRequestException(
        `Parent job title ${parentJobTitleId} not found`,
      );
    }
  }
}
