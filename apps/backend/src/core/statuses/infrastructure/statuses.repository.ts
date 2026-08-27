import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatusesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByGroupAndCode(groupCode: string, statusCode: string) {
    return this.prisma.status.findFirst({
      where: { code: statusCode, group: { code: groupCode } },
    });
  }
}
