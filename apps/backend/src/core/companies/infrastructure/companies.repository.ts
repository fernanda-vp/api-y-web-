import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { name: string; rfc: string; statusId: number }) {
    return this.prisma.company.create({ data, include: { status: true } });
  }

  findMany(where: { statusId?: number } = {}) {
    return this.prisma.company.findMany({
      where,
      include: { status: true },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.company.findUnique({
      where: { id },
      include: { status: true },
    });
  }

  update(id: number, data: { name?: string; rfc?: string }) {
    return this.prisma.company.update({
      where: { id },
      data,
      include: { status: true },
    });
  }

  setStatus(id: number, statusId: number) {
    return this.prisma.company.update({
      where: { id },
      data: { statusId },
      include: { status: true },
    });
  }
}
