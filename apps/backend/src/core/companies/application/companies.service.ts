import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusesService } from '../../statuses/application/statuses.service';
import { RfcPolicy } from '../domain/rfc.policy';
import { CompaniesRepository } from '../infrastructure/companies.repository';

const STATUS_GROUP = 'COMPANY';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly statusesService: StatusesService,
  ) {}

  async create(name: string, rfc: string) {
    if (!RfcPolicy.isValid(rfc)) {
      throw new BadRequestException('Invalid RFC format');
    }

    const activeStatus = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.companiesRepository.create({
      name,
      rfc: RfcPolicy.normalize(rfc),
      statusId: activeStatus.id,
    });
  }

  async findAll(statusFilter?: string) {
    if (!statusFilter) {
      return this.companiesRepository.findMany();
    }

    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      statusFilter.toUpperCase(),
    );
    return this.companiesRepository.findMany({ statusId: status.id });
  }

  async findById(id: number) {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException(`Company ${id} not found`);
    }
    return company;
  }

  async update(id: number, data: { name?: string; rfc?: string }) {
    await this.findById(id);

    if (data.rfc && !RfcPolicy.isValid(data.rfc)) {
      throw new BadRequestException('Invalid RFC format');
    }

    return this.companiesRepository.update(id, {
      ...data,
      rfc: data.rfc ? RfcPolicy.normalize(data.rfc) : undefined,
    });
  }

  async enable(id: number) {
    await this.findById(id);
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'ACTIVE',
    );
    return this.companiesRepository.setStatus(id, status.id);
  }

  async disable(id: number) {
    await this.findById(id);
    const status = await this.statusesService.getRequired(
      STATUS_GROUP,
      'INACTIVE',
    );
    return this.companiesRepository.setStatus(id, status.id);
  }
}
