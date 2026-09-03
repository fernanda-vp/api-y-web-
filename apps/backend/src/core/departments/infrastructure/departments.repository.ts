import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async companyExists(companyId: number): Promise<boolean> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    return company !== null;
  }

  create(data: {
    companyId: number;
    name: string;
    parentDepartmentId: number | null;
    statusId: number;
  }) {
    return this.prisma.department.create({ data, include: { status: true } });
  }

  findMany(where: Prisma.DepartmentWhereInput, skip: number, take: number) {
    return this.prisma.department.findMany({
      where,
      include: { status: true },
      orderBy: { name: 'asc' },
      skip,
      take,
    });
  }

  count(where: Prisma.DepartmentWhereInput) {
    return this.prisma.department.count({ where });
  }

  findById(id: number) {
    return this.prisma.department.findUnique({
      where: { id },
      include: { status: true },
    });
  }

  findAllByCompany(companyId: number) {
    return this.prisma.department.findMany({
      where: { companyId },
      include: { status: true },
      orderBy: { name: 'asc' },
    });
  }

  update(
    id: number,
    data: { name?: string; parentDepartmentId?: number | null },
  ) {
    return this.prisma.department.update({
      where: { id },
      data,
      include: { status: true },
    });
  }

  setStatus(id: number, statusId: number) {
    return this.prisma.department.update({
      where: { id },
      data: { statusId },
      include: { status: true },
    });
  }
}
