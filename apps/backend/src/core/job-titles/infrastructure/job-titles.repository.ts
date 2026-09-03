import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobTitlesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    name: string;
    parentJobTitleId: number | null;
    statusId: number;
  }) {
    return this.prisma.jobTitle.create({ data, include: { status: true } });
  }

  findMany(where: Prisma.JobTitleWhereInput, skip: number, take: number) {
    return this.prisma.jobTitle.findMany({
      where,
      include: { status: true },
      orderBy: { name: 'asc' },
      skip,
      take,
    });
  }

  count(where: Prisma.JobTitleWhereInput) {
    return this.prisma.jobTitle.count({ where });
  }

  findById(id: number) {
    return this.prisma.jobTitle.findUnique({
      where: { id },
      include: { status: true },
    });
  }

  findAll() {
    return this.prisma.jobTitle.findMany({
      include: { status: true },
      orderBy: { name: 'asc' },
    });
  }

  update(
    id: number,
    data: { name?: string; parentJobTitleId?: number | null },
  ) {
    return this.prisma.jobTitle.update({
      where: { id },
      data,
      include: { status: true },
    });
  }

  setStatus(id: number, statusId: number) {
    return this.prisma.jobTitle.update({
      where: { id },
      data: { statusId },
      include: { status: true },
    });
  }
}
