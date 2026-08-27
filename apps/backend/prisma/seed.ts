import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
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
