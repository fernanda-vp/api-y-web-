import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const POSITION_INCLUDE = {
  status: true,
  employee: { include: { user: true, status: true } },
  jobTitle: { include: { status: true } },
  department: { include: { status: true } },
  zone: { include: { status: true } },
} satisfies Prisma.PositionInclude;

@Injectable()
export class PositionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async employeeExists(employeeId: number): Promise<boolean> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    return employee !== null;
  }

  async getJobTitleParentId(
    jobTitleId: number,
  ): Promise<number | null | undefined> {
    const jobTitle = await this.prisma.jobTitle.findUnique({
      where: { id: jobTitleId },
      select: { parentJobTitleId: true },
    });
    return jobTitle?.parentJobTitleId;
  }

  async getDepartmentCompanyId(
    departmentId: number,
  ): Promise<number | undefined> {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: { companyId: true },
    });
    return department?.companyId;
  }

  async getZoneCompanyId(zoneId: number): Promise<number | undefined> {
    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
      select: { companyId: true },
    });
    return zone?.companyId;
  }

  async hasActivePosition(employeeId: number): Promise<boolean> {
    const count = await this.prisma.position.count({
      where: { employeeId, endDate: null },
    });
    return count > 0;
  }

  create(data: {
    employeeId: number;
    jobTitleId: number;
    departmentId: number;
    zoneId: number;
    managerPositionId: number | null;
    functionalManagerPositionId: number | null;
    startDate: Date;
    statusId: number;
  }) {
    return this.prisma.position.create({ data, include: POSITION_INCLUDE });
  }

  findMany(where: Prisma.PositionWhereInput, skip: number, take: number) {
    return this.prisma.position.findMany({
      where,
      include: POSITION_INCLUDE,
      orderBy: { startDate: 'desc' },
      skip,
      take,
    });
  }

  count(where: Prisma.PositionWhereInput) {
    return this.prisma.position.count({ where });
  }

  findById(id: number) {
    return this.prisma.position.findUnique({
      where: { id },
      include: POSITION_INCLUDE,
    });
  }

  findActiveCandidates(jobTitleId: number, departmentId: number) {
    return this.prisma.position.findMany({
      where: {
        jobTitleId,
        departmentId,
        endDate: null,
        status: { code: 'ACTIVE' },
      },
      include: POSITION_INCLUDE,
    });
  }

  update(
    id: number,
    data: {
      managerPositionId?: number | null;
      functionalManagerPositionId?: number | null;
    },
  ) {
    return this.prisma.position.update({
      where: { id },
      data,
      include: POSITION_INCLUDE,
    });
  }

  close(id: number, endDate: Date, statusId: number) {
    return this.prisma.position.update({
      where: { id },
      data: { endDate, statusId },
      include: POSITION_INCLUDE,
    });
  }

  /**
   * Transferir es "cerrar la posición actual + crear la nueva" — ambas
   * escrituras van en una sola `$transaction` para que no puedan quedar a
   * medias (ver spec 0013 Revisión — antes eran dos llamadas separadas).
   */
  async transferAtomically(
    closingId: number,
    effectiveDate: Date,
    endedStatusId: number,
    newPosition: {
      employeeId: number;
      jobTitleId: number;
      departmentId: number;
      zoneId: number;
      managerPositionId: number | null;
      functionalManagerPositionId: number | null;
      startDate: Date;
      statusId: number;
    },
  ) {
    const [, created] = await this.prisma.$transaction([
      this.prisma.position.update({
        where: { id: closingId },
        data: { endDate: effectiveDate, statusId: endedStatusId },
        include: POSITION_INCLUDE,
      }),
      this.prisma.position.create({
        data: newPosition,
        include: POSITION_INCLUDE,
      }),
    ]);
    return created;
  }
}
