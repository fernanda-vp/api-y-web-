import { ForbiddenException, Injectable } from '@nestjs/common';
import { getDescendantIds } from '../../common/hierarchy/tree.util';
import { RolesRepository } from '../infrastructure/roles.repository';

export interface ScopeTarget {
  companyId?: number;
  zoneId?: number;
  departmentId?: number;
  jobTitleId?: number;
}

export interface ScopeGrant {
  global: boolean;
  companyIds: number[];
  zoneIds: number[];
  /** Already expanded to include every descendant of each granted department. */
  departmentIds: number[];
  /** Already expanded to include every descendant of each granted job title. */
  jobTitleIds: number[];
}

@Injectable()
export class PermissionsService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  /** All permission actions the user holds through any role assignment, in any scope. */
  getEffectivePermissions(userId: number): Promise<string[]> {
    return this.rolesRepository.findPermissionActionsForUser(userId);
  }

  async getScopeGrant(userId: number, permission: string): Promise<ScopeGrant> {
    const assignments = await this.rolesRepository.findGrantingAssignments(
      userId,
      permission,
    );

    const global = assignments.some((a) => a.scopeType === 'GLOBAL');
    const companyIds = assignments
      .filter((a) => a.scopeType === 'COMPANY' && a.scopeId !== null)
      .map((a) => a.scopeId as number);
    const zoneIds = assignments
      .filter((a) => a.scopeType === 'ZONE' && a.scopeId !== null)
      .map((a) => a.scopeId as number);

    const departmentRoots = assignments
      .filter((a) => a.scopeType === 'DEPARTMENT' && a.scopeId !== null)
      .map((a) => a.scopeId as number);
    let departmentIds: number[] = [];
    if (departmentRoots.length > 0) {
      const rows = await this.rolesRepository.findDepartmentHierarchy();
      const items = rows.map((row) => ({
        id: row.id,
        parentId: row.parentDepartmentId,
      }));
      departmentIds = [
        ...new Set(
          departmentRoots.flatMap((rootId) => getDescendantIds(items, rootId)),
        ),
      ];
    }

    const jobTitleRoots = assignments
      .filter((a) => a.scopeType === 'JOB_TITLE' && a.scopeId !== null)
      .map((a) => a.scopeId as number);
    let jobTitleIds: number[] = [];
    if (jobTitleRoots.length > 0) {
      const rows = await this.rolesRepository.findJobTitleHierarchy();
      const items = rows.map((row) => ({
        id: row.id,
        parentId: row.parentJobTitleId,
      }));
      jobTitleIds = [
        ...new Set(
          jobTitleRoots.flatMap((rootId) => getDescendantIds(items, rootId)),
        ),
      ];
    }

    return { global, companyIds, zoneIds, departmentIds, jobTitleIds };
  }

  async assertScope(
    userId: number,
    permission: string,
    target: ScopeTarget,
  ): Promise<void> {
    const grant = await this.getScopeGrant(userId, permission);
    if (!this.grantCoversTarget(grant, target)) {
      throw new ForbiddenException(
        `You do not have permission "${permission}" for this scope`,
      );
    }
  }

  grantCoversTarget(grant: ScopeGrant, target: ScopeTarget): boolean {
    return (
      grant.global ||
      (target.companyId !== undefined &&
        grant.companyIds.includes(target.companyId)) ||
      (target.zoneId !== undefined && grant.zoneIds.includes(target.zoneId)) ||
      (target.departmentId !== undefined &&
        grant.departmentIds.includes(target.departmentId)) ||
      (target.jobTitleId !== undefined &&
        grant.jobTitleIds.includes(target.jobTitleId))
    );
  }
}
