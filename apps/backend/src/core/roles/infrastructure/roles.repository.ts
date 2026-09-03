import { Injectable } from '@nestjs/common';
import { Prisma, ScopeType } from '../../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ROLE_ASSIGNMENT_INCLUDE = {
  role: { include: { status: true } },
} satisfies Prisma.RoleAssignmentInclude;

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        status: true,
        rolePermissions: { include: { permission: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findRoleById(id: number) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        status: true,
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async createRole(name: string, statusId: number) {
    return this.prisma.role.create({
      data: { name, isSystem: false, statusId },
      include: {
        status: true,
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  updateRole(id: number, name: string) {
    return this.prisma.role.update({
      where: { id },
      data: { name },
      include: {
        status: true,
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  setStatus(id: number, statusId: number) {
    return this.prisma.role.update({
      where: { id },
      data: { statusId },
      include: {
        status: true,
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  nameExists(name: string): Promise<boolean> {
    return this.prisma.role
      .findUnique({ where: { name }, select: { id: true } })
      .then((r) => r !== null);
  }

  findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { action: 'asc' },
      include: { dependencies: { select: { dependsOnId: true } } },
    });
  }

  findPermissionById(id: number) {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async grantPermission(roleId: number, permissionId: number) {
    await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
    return this.findRoleById(roleId);
  }

  async revokePermission(roleId: number, permissionId: number) {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
    return this.findRoleById(roleId);
  }

  async bulkSetPermissions(
    roleId: number,
    permissionIds: number[],
    grant: boolean,
  ) {
    if (grant) {
      await this.prisma.$transaction(
        permissionIds.map((permissionId) =>
          this.prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId, permissionId } },
            update: {},
            create: { roleId, permissionId },
          }),
        ),
      );
    } else {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId, permissionId: { in: permissionIds } },
      });
    }
    return this.findRoleById(roleId);
  }

  createAssignment(data: {
    userId: number;
    roleId: number;
    scopeType: ScopeType;
    scopeId: number | null;
  }) {
    return this.prisma.roleAssignment.create({
      data,
      include: ROLE_ASSIGNMENT_INCLUDE,
    });
  }

  findAssignmentById(id: number) {
    return this.prisma.roleAssignment.findUnique({ where: { id } });
  }

  deleteAssignment(id: number) {
    return this.prisma.roleAssignment.delete({ where: { id } });
  }

  findAssignmentsByUser(userId: number) {
    return this.prisma.roleAssignment.findMany({
      where: { userId },
      include: ROLE_ASSIGNMENT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Assignments the user holds through an active role that grants `permissionAction`. */
  findGrantingAssignments(userId: number, permissionAction: string) {
    return this.prisma.roleAssignment.findMany({
      where: {
        userId,
        role: {
          status: { isActive: true },
          rolePermissions: {
            some: { permission: { action: permissionAction } },
          },
        },
      },
    });
  }

  async findPermissionActionsForUser(userId: number): Promise<string[]> {
    const assignments = await this.prisma.roleAssignment.findMany({
      where: { userId, role: { status: { isActive: true } } },
      select: {
        role: {
          select: {
            rolePermissions: {
              select: { permission: { select: { action: true } } },
            },
          },
        },
      },
    });

    const actions = new Set<string>();
    for (const assignment of assignments) {
      for (const rolePermission of assignment.role.rolePermissions) {
        actions.add(rolePermission.permission.action);
      }
    }
    return [...actions];
  }

  async hasGrantingAssignment(
    userId: number,
    permissionAction: string,
  ): Promise<boolean> {
    const count = await this.prisma.roleAssignment.count({
      where: {
        userId,
        role: {
          status: { isActive: true },
          rolePermissions: {
            some: { permission: { action: permissionAction } },
          },
        },
      },
    });
    return count > 0;
  }

  getZoneCompanyId(id: number): Promise<number | undefined> {
    return this.prisma.zone
      .findUnique({ where: { id }, select: { companyId: true } })
      .then((z) => z?.companyId);
  }

  getDepartmentCompanyId(id: number): Promise<number | undefined> {
    return this.prisma.department
      .findUnique({ where: { id }, select: { companyId: true } })
      .then((d) => d?.companyId);
  }

  /** Active positions of the Employee linked to this User, for scoping "who can see/manage this user". */
  findActivePositionsForUser(userId: number) {
    return this.prisma.position.findMany({
      where: { employee: { userId }, endDate: null },
      select: {
        departmentId: true,
        zoneId: true,
        jobTitleId: true,
        department: { select: { companyId: true } },
      },
    });
  }

  companyExists(id: number): Promise<boolean> {
    return this.prisma.company
      .findUnique({ where: { id }, select: { id: true } })
      .then((c) => c !== null);
  }

  zoneExists(id: number): Promise<boolean> {
    return this.prisma.zone
      .findUnique({ where: { id }, select: { id: true } })
      .then((z) => z !== null);
  }

  departmentExists(id: number): Promise<boolean> {
    return this.prisma.department
      .findUnique({ where: { id }, select: { id: true } })
      .then((d) => d !== null);
  }

  jobTitleExists(id: number): Promise<boolean> {
    return this.prisma.jobTitle
      .findUnique({ where: { id }, select: { id: true } })
      .then((j) => j !== null);
  }

  findDepartmentHierarchy() {
    return this.prisma.department.findMany({
      select: { id: true, parentDepartmentId: true },
    });
  }

  findJobTitleHierarchy() {
    return this.prisma.jobTitle.findMany({
      select: { id: true, parentJobTitleId: true },
    });
  }
}
