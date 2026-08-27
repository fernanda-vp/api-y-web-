import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { StatusesRepository } from '../infrastructure/statuses.repository';

@Injectable()
export class StatusesService {
  constructor(private readonly statusesRepository: StatusesRepository) {}

  async getRequired(groupCode: string, statusCode: string) {
    const status = await this.statusesRepository.findByGroupAndCode(
      groupCode,
      statusCode,
    );
    if (!status) {
      throw new InternalServerErrorException(
        `Status "${statusCode}" not seeded for group "${groupCode}"`,
      );
    }
    return status;
  }
}
