import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import {
  PERMISSION_DEPENDENCIES,
  PERMISSIONS,
  PREDEFINED_ROLES,
  ROLE_PERMISSIONS,
} from '../src/core/roles/domain/permission-catalog';
import { PasswordPolicy } from '../src/core/users/domain/password.policy';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin123!';

async function seedStatusGroup(
  code: string,
  description: string,
  statuses: Array<{ code: string; description: string; isActive: boolean }>,
) {
  const group = await prisma.statusGroup.upsert({
    where: { code },
    update: {},
    create: { code, description },
  });

  const created = await Promise.all(
    statuses.map((status) =>
      prisma.status.upsert({
        where: { groupId_code: { groupId: group.id, code: status.code } },
        update: {},
        create: { groupId: group.id, ...status },
      }),
    ),
  );

  return created;
}

async function seedRolesAndPermissions(roleActiveStatusId: number) {
  const permissions = await Promise.all(
    PERMISSIONS.map((action) =>
      prisma.permission.upsert({
        where: { action },
        update: {},
        create: { action },
      }),
    ),
  );
  const permissionsByAction = new Map(permissions.map((permission) => [permission.action, permission]));

  const roles = await Promise.all(
    PREDEFINED_ROLES.map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name, isSystem: true, statusId: roleActiveStatusId },
      }),
    ),
  );

  for (const role of roles) {
    const grantedActions = ROLE_PERMISSIONS[role.name] ?? [];
    for (const action of grantedActions) {
      const permission = permissionsByAction.get(action);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  for (const [action, dependsOnActions] of Object.entries(PERMISSION_DEPENDENCIES)) {
    const permission = permissionsByAction.get(action);
    if (!permission) continue;
    for (const dependsOnAction of dependsOnActions ?? []) {
      const dependsOn = permissionsByAction.get(dependsOnAction);
      if (!dependsOn) continue;
      await prisma.permissionDependency.upsert({
        where: { permissionId_dependsOnId: { permissionId: permission.id, dependsOnId: dependsOn.id } },
        update: {},
        create: { permissionId: permission.id, dependsOnId: dependsOn.id },
      });
    }
  }

  return roles;
}

async function main() {
  const [userActive] = await seedStatusGroup('USER', 'User account status', [
    { code: 'ACTIVE', description: 'Active', isActive: true },
    { code: 'INACTIVE', description: 'Inactive', isActive: false },
  ]);

  await seedStatusGroup('EMPLOYEE', 'Employee employment status', [
    { code: 'ACTIVE', description: 'Active', isActive: true },
    { code: 'INACTIVE', description: 'Inactive', isActive: false },
    { code: 'TERMINATED', description: 'Terminated', isActive: false },
  ]);

  await seedStatusGroup('COMPANY', 'Company status', [
    { code: 'ACTIVE', description: 'Active', isActive: true },
    { code: 'INACTIVE', description: 'Inactive', isActive: false },
  ]);

  await seedStatusGroup('ZONE', 'Zone status', [
    { code: 'ACTIVE', description: 'Active', isActive: true },
    { code: 'INACTIVE', description: 'Inactive', isActive: false },
  ]);

  await seedStatusGroup('DEPARTMENT', 'Department status', [
    { code: 'ACTIVE', description: 'Active', isActive: true },
    { code: 'INACTIVE', description: 'Inactive', isActive: false },
  ]);

  await seedStatusGroup('JOB_TITLE', 'Job title status', [
    { code: 'ACTIVE', description: 'Active', isActive: true },
    { code: 'INACTIVE', description: 'Inactive', isActive: false },
  ]);

  await seedStatusGroup('POSITION', 'Position status', [
    { code: 'ACTIVE', description: 'Active', isActive: true },
    { code: 'ENDED', description: 'Ended', isActive: false },
  ]);

  const [roleActive] = await seedStatusGroup('ROLE', 'Role status', [
    { code: 'ACTIVE', description: 'Active', isActive: true },
    { code: 'INACTIVE', description: 'Inactive', isActive: false },
  ]);

  const passwordHash = await PasswordPolicy.hash(ADMIN_PASSWORD);

  const adminUser = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      name: 'Admin',
      lastName: 'User',
      statusId: userActive.id,
      credential: {
        create: { passwordHash },
      },
    },
  });

  const roles = await seedRolesAndPermissions(roleActive.id);
  const generalAdminRole = roles.find((role) => role.name === 'Administrador General');
  if (generalAdminRole) {
    const existingAssignment = await prisma.roleAssignment.findFirst({
      where: { userId: adminUser.id, roleId: generalAdminRole.id, scopeType: 'GLOBAL' },
    });
    if (!existingAssignment) {
      await prisma.roleAssignment.create({
        data: { userId: adminUser.id, roleId: generalAdminRole.id, scopeType: 'GLOBAL', scopeId: null },
      });
    }
  }

  console.log(`Seed complete. Admin user "${adminUser.username}" ready (password: ${ADMIN_PASSWORD}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
