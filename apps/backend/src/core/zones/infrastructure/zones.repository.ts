import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ZonesRepository {
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
    address: string;
    statusId: number;
  }) {
    return this.prisma.zone.create({ data, include: { status: true } });
  }

  findMany(where: Prisma.ZoneWhereInput, skip: number, take: number) {
    return this.prisma.zone.findMany({
      where,
      include: { status: true },
      orderBy: { name: 'asc' },
      skip,
      take,
    });
  }

  count(where: Prisma.ZoneWhereInput) {
    return this.prisma.zone.count({ where });
  }

  findById(id: number) {
    return this.prisma.zone.findUnique({
      where: { id },
      include: { status: true },
    });
  }

  update(id: number, data: { name?: string; address?: string }) {
    return this.prisma.zone.update({
      where: { id },
      data,
      include: { status: true },
    });
  }

  setStatus(id: number, statusId: number) {
    return this.prisma.zone.update({
      where: { id },
      data: { statusId },
      include: { status: true },
    });
  }
}
