import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ScopeType } from '../../../../generated/prisma/client';
import { StatusesService } from '../../statuses/application/statuses.service';
import { RolesRepository } from '../infrastructure/roles.repository';
import { PermissionsService, type ScopeTarget } from './permissions.service';

const STATUS_GROUP = 'ROLE';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly statusesService: StatusesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  findAllRoles() {
    return this.rolesRepository.findAllRoles();
  }

  async findAllPermissions() {
    const permissions = await this.rolesRepository.findAllPermissions();
    return permissions.map((permission) => ({
      id: permission.id,
      action: permission.action,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      dependsOn: permission.dependencies.map(
        (dependency) => dependency.dependsOnId,
      ),
    }));
  }

  async createRole(name: string) {
    if (await this.rolesRepository.nameExists(name)) {
      throw new ConflictException(`Role "${name}" already exists`);
    }
    const activeStatus = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.rolesRepository.createRole(name, activeStatus.id);
  }

  async updateRole(id: number, name: string) {
    const role = await this.getRoleOrThrow(id);
    this.assertNotSystemRole(role);

    if (name !== role.name && (await this.rolesRepository.nameExists(name))) {
      throw new ConflictException(`Role "${name}" already exists`);
    }

    return this.rolesRepository.updateRole(id, name);
  }

  async enableRole(id: number) {
    const role = await this.getRoleOrThrow(id);
    this.assertNotSystemRole(role);
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.rolesRepository.setStatus(id, status.id);
  }

  async disableRole(id: number) {
    const role = await this.getRoleOrThrow(id);
    this.assertNotSystemRole(role);
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'INACTIVE',
    );
    return this.rolesRepository.setStatus(id, status.id);
  }

  private async getRoleOrThrow(id: number) {
    const role = await this.rolesRepository.findRoleById(id);
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  private assertNotSystemRole(role: { isSystem: boolean }) {
    if (role.isSystem) {
      throw new BadRequestException(
        'System roles cannot be renamed, enabled or disabled',
      );
    }
  }

  async grantPermission(roleId: number, permissionId: number) {
    const role = await this.assertRoleAndPermissionExist(roleId, permissionId);
    const currentIds = role.rolePermissions.map((rp) => rp.permission.id);
    await this.assertConsistentPermissionSet(
      new Set([...currentIds, permissionId]),
    );
    return this.rolesRepository.grantPermission(roleId, permissionId);
  }

  async revokePermission(roleId: number, permissionId: number) {
    const role = await this.assertRoleAndPermissionExist(roleId, permissionId);
    const currentIds = role.rolePermissions.map((rp) => rp.permission.id);
    await this.assertConsistentPermissionSet(
      new Set(currentIds.filter((id) => id !== permissionId)),
    );
    return this.rolesRepository.revokePermission(roleId, permissionId);
  }

  private async assertRoleAndPermissionExist(
    roleId: number,
    permissionId: number,
  ) {
    const role = await this.rolesRepository.findRoleById(roleId);
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }
    const permission =
      await this.rolesRepository.findPermissionById(permissionId);
    if (!permission) {
      throw new NotFoundException(`Permission ${permissionId} not found`);
    }
    return role;
  }

  async bulkSetPermissions(
    roleId: number,
    permissionIds: number[],
    grant: boolean,
  ) {
    const role = await this.rolesRepository.findRoleById(roleId);
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const currentIds = new Set(
      role.rolePermissions.map((rp) => rp.permission.id),
    );
    const finalIds = grant
      ? new Set([...currentIds, ...permissionIds])
      : new Set([...currentIds].filter((id) => !permissionIds.includes(id)));
    await this.assertConsistentPermissionSet(finalIds);

    return this.rolesRepository.bulkSetPermissions(
      roleId,
      permissionIds,
      grant,
    );
  }

  /**
   * Valida que, para cada permiso en `finalPermissionIds`, todas sus
   * dependencias (`PermissionDependency`) también estén incluidas — evita
   * dejar un rol con un permiso otorgado pero una dependencia suya faltante
   * (ver spec 0017). Se valida sobre el conjunto resultante completo, no
   * permiso por permiso, para que grant/revoke individuales y en bloque
   * compartan la misma regla.
   */
  private async assertConsistentPermissionSet(
    finalPermissionIds: Set<number>,
  ): Promise<void> {
    const permissions = await this.rolesRepository.findAllPermissions();
    const actionById = new Map(permissions.map((p) => [p.id, p.action]));
    const dependsOnById = new Map(
      permissions.map((p) => [p.id, p.dependencies.map((d) => d.dependsOnId)]),
    );

    const violations: Array<{
      permission: string;
      missingDependencies: string[];
    }> = [];
    for (const permissionId of finalPermissionIds) {
      const missingIds = (dependsOnById.get(permissionId) ?? []).filter(
        (dependsOnId) => !finalPermissionIds.has(dependsOnId),
      );
      if (missingIds.length > 0) {
        violations.push({
          permission: actionById.get(permissionId) ?? String(permissionId),
          missingDependencies: missingIds.map(
            (id) => actionById.get(id) ?? String(id),
          ),
        });
      }
    }

    if (violations.length > 0) {
      throw new ConflictException({
        message:
          'This change would leave one or more permissions without a required dependency.',
        violations,
      });
    }
  }

  async createAssignment(
    callerUserId: number,
    data: {
      userId: number;
      roleId: number;
      scopeType: ScopeType;
      scopeId?: number;
    },
  ) {
    const role = await this.rolesRepository.findRoleById(data.roleId);
    if (!role) {
      throw new BadRequestException(`Role ${data.roleId} not found`);
    }

    const scopeId = data.scopeType === 'GLOBAL' ? null : (data.scopeId ?? null);
    if (data.scopeType !== 'GLOBAL' && scopeId === null) {
      throw new BadRequestException(
        `scopeId is required for scopeType "${data.scopeType}"`,
      );
    }
    if (scopeId !== null) {
      await this.assertScopeIdExists(data.scopeType, scopeId);
    }

    // El que asigna solo puede otorgar un alcance que él mismo ya cubre con
    // `roles:assign` — de lo contrario alguien con alcance de un solo
    // departamento podría asignarse a sí mismo (o a otro) un rol GLOBAL.
    const target = await this.buildScopeTargetForScope(data.scopeType, scopeId);
    await this.permissionsService.assertScope(
      callerUserId,
      'roles:assign',
      target,
    );

    return this.rolesRepository.createAssignment({
      userId: data.userId,
      roleId: data.roleId,
      scopeType: data.scopeType,
      scopeId,
    });
  }

  private async assertScopeIdExists(scopeType: ScopeType, scopeId: number) {
    const exists = await this.scopeIdExists(scopeType, scopeId);
    if (!exists) {
      throw new BadRequestException(`${scopeType} ${scopeId} not found`);
    }
  }

  private scopeIdExists(
    scopeType: ScopeType,
    scopeId: number,
  ): Promise<boolean> {
    switch (scopeType) {
      case 'COMPANY':
        return this.rolesRepository.companyExists(scopeId);
      case 'ZONE':
        return this.rolesRepository.zoneExists(scopeId);
      case 'DEPARTMENT':
        return this.rolesRepository.departmentExists(scopeId);
      case 'JOB_TITLE':
        return this.rolesRepository.jobTitleExists(scopeId);
      case 'GLOBAL':
        return Promise.resolve(true);
    }
  }

  async deleteAssignment(callerUserId: number, id: number) {
    const assignment = await this.rolesRepository.findAssignmentById(id);
    if (!assignment) {
      throw new NotFoundException(`Role assignment ${id} not found`);
    }

    const target = await this.buildScopeTargetForScope(
      assignment.scopeType,
      assignment.scopeId,
    );
    await this.permissionsService.assertScope(
      callerUserId,
      'roles:revoke',
      target,
    );

    return this.rolesRepository.deleteAssignment(id);
  }

  async findAssignmentsByUser(callerUserId: number, targetUserId: number) {
    await this.assertUserScope(callerUserId, 'roles:read', targetUserId);
    return this.rolesRepository.findAssignmentsByUser(targetUserId);
  }

  /** Alcance a validar para un `RoleAssignment` según su propio scopeType/scopeId. */
  private async buildScopeTargetForScope(
    scopeType: ScopeType,
    scopeId: number | null,
  ): Promise<ScopeTarget> {
    switch (scopeType) {
      case 'GLOBAL':
        return {};
      case 'COMPANY':
        return { companyId: scopeId ?? undefined };
      case 'ZONE': {
        const companyId =
          scopeId !== null
            ? await this.rolesRepository.getZoneCompanyId(scopeId)
            : undefined;
        return { companyId, zoneId: scopeId ?? undefined };
      }
      case 'DEPARTMENT': {
        const companyId =
          scopeId !== null
            ? await this.rolesRepository.getDepartmentCompanyId(scopeId)
            : undefined;
        return { companyId, departmentId: scopeId ?? undefined };
      }
      case 'JOB_TITLE':
        return { jobTitleId: scopeId ?? undefined };
    }
  }

  /**
   * Igual criterio que `EmployeesService.assertEmployeeScope`: el usuario
   * objetivo no tiene compañía/departamento propios — se derivan de las
   * Position activas de su Employee. Alcanza con que UNA matchee (un usuario
   * sin Employee o sin posiciones activas solo es visible con alcance GLOBAL).
   */
  private async assertUserScope(
    callerUserId: number,
    permission: string,
    targetUserId: number,
  ): Promise<void> {
    const grant = await this.permissionsService.getScopeGrant(
      callerUserId,
      permission,
    );
    if (grant.global) return;

    const positions =
      await this.rolesRepository.findActivePositionsForUser(targetUserId);
    const targets: ScopeTarget[] = positions.map((position) => ({
      companyId: position.department.companyId,
      departmentId: position.departmentId,
      zoneId: position.zoneId,
      jobTitleId: position.jobTitleId,
    }));

    const allowed = targets.some((target) =>
      this.permissionsService.grantCoversTarget(grant, target),
    );
    if (!allowed) {
      throw new ForbiddenException(
        `You do not have permission "${permission}" for this scope`,
      );
    }
  }
}
