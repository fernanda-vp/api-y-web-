import { Injectable } from '@nestjs/common';
import { ContractType, Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async usernameExists(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return user !== null;
  }

  async codeExists(code: string): Promise<boolean> {
    const employee = await this.prisma.employee.findUnique({
      where: { code },
      select: { id: true },
    });
    return employee !== null;
  }

  createWithUser(data: {
    username: string;
    name: string;
    lastName: string;
    passwordHash: string;
    userStatusId: number;
    code: string;
    phone?: string;
    bio?: string;
    hireDate?: Date;
    contractType?: ContractType;
    contractEndDate?: Date;
    employeeStatusId: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: data.username,
          name: data.name,
          lastName: data.lastName,
          statusId: data.userStatusId,
          credential: { create: { passwordHash: data.passwordHash } },
        },
      });

      return tx.employee.create({
        data: {
          userId: user.id,
          code: data.code,
          phone: data.phone,
          bio: data.bio,
          hireDate: data.hireDate,
          contractType: data.contractType,
          contractEndDate: data.contractEndDate,
          statusId: data.employeeStatusId,
        },
        include: { status: true, user: true },
      });
    });
  }

  findMany(where: Prisma.EmployeeWhereInput, skip: number, take: number) {
    return this.prisma.employee.findMany({
      where,
      include: { status: true, user: true },
      orderBy: { user: { name: 'asc' } },
      skip,
      take,
    });
  }

  count(where: Prisma.EmployeeWhereInput) {
    return this.prisma.employee.count({ where });
  }

  findById(id: number) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { status: true, user: true },
    });
  }

  findByUserId(userId: number) {
    return this.prisma.employee.findUnique({
      where: { userId },
      include: { status: true, user: true },
    });
  }

  findActivePositions(employeeId: number) {
    return this.prisma.position.findMany({
      where: { employeeId, endDate: null },
      select: {
        departmentId: true,
        zoneId: true,
        jobTitleId: true,
        department: { select: { companyId: true } },
      },
    });
  }

  updateProfile(
    employeeId: number,
    userId: number,
    userFields: { name?: string; lastName?: string; photoUrl?: string | null },
    employeeFields: {
      phone?: string | null;
      bio?: string | null;
      code?: string;
      hireDate?: Date;
      contractType?: ContractType;
      contractEndDate?: Date | null;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({ where: { id: userId }, data: userFields });
      }
      return tx.employee.update({
        where: { id: employeeId },
        data: employeeFields,
        include: { status: true, user: true },
      });
    });
  }

  setLifecycleStatus(
    employeeId: number,
    userId: number,
    employeeStatusId: number,
    userStatusId: number,
    terminationDate: Date | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { statusId: userStatusId },
      });
      return tx.employee.update({
        where: { id: employeeId },
        data: { statusId: employeeStatusId, terminationDate },
        include: { status: true, user: true },
      });
    });
  }
}
