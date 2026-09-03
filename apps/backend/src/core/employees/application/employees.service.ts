import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildPaginatedResult } from '../../common/pagination/paginated-result';
import {
  PermissionsService,
  type ScopeTarget,
} from '../../roles/application/permissions.service';
import { StatusesService } from '../../statuses/application/statuses.service';
import { PasswordPolicy } from '../../users/domain/password.policy';
import { ContractType, Prisma } from '../../../../generated/prisma/client';
import { TempPasswordPolicy } from '../domain/temp-password.policy';
import { UsernamePolicy } from '../domain/username.policy';
import { EmployeesRepository } from '../infrastructure/employees.repository';
import type { FindEmployeesQueryDto } from '../presentation/dto/find-employees-query.dto';

const EMPLOYEE_STATUS_GROUP = 'EMPLOYEE';
const USER_STATUS_GROUP = 'USER';
const MAX_USERNAME_COLLISION_RETRIES = 5;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly statusesService: StatusesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(
    userId: number,
    input: {
      name: string;
      lastName: string;
      code: string;
      phone?: string;
      bio?: string;
      hireDate?: Date;
      contractType?: ContractType;
      contractEndDate?: Date;
    },
  ) {
    // Un Employee recién creado todavía no tiene ninguna Position — no hay
    // departamento/zona/puesto contra el cual validar alcance, así que solo
    // un alcance GLOBAL puede dar de alta empleados (mismo criterio que la
    // creación de un puesto raíz sin padre en job-titles).
    await this.permissionsService.assertScope(userId, 'employees:create', {});

    if (await this.employeesRepository.codeExists(input.code)) {
      throw new ConflictException(
        `Employee code "${input.code}" is already in use`,
      );
    }

    // Prisma persiste `contractType: INDEFINITE` por default si se omite
    // (@default(INDEFINITE) en el schema) — hay que validar contra ese valor
    // efectivo, no contra el `undefined` crudo del DTO, o la regla "indefinido
    // no lleva fecha de fin" queda sin aplicar cuando no se manda contractType.
    const effectiveContractType = input.contractType ?? 'INDEFINITE';
    this.assertValidContract(effectiveContractType, input.contractEndDate);

    const [userActiveStatus, employeeActiveStatus] = await Promise.all([
      this.statusesService.getRequired(USER_STATUS_GROUP, 'ACTIVE'),
      this.statusesService.getRequired(EMPLOYEE_STATUS_GROUP, 'ACTIVE'),
    ]);

    const temporaryPassword = TempPasswordPolicy.generate();
    const passwordHash = await PasswordPolicy.hash(temporaryPassword);

    const employee = await this.createWithUniqueUsername(
      input,
      passwordHash,
      userActiveStatus.id,
      employeeActiveStatus.id,
    );

    return { employee, temporaryPassword };
  }

  /**
   * `generateUsername` chequea disponibilidad y luego `createWithUser` inserta
   * en dos pasos separados — dos altas concurrentes para el mismo nombre
   * pueden pasar ambas el chequeo y chocar en el `UNIQUE` de `User.username`,
   * lo que sin este manejo se propagaba como un 500 sin controlar. Si eso
   * pasa, se regenera el username (ahora sí ve la fila recién insertada por
   * el otro request) y se reintenta, acotado para no loopear indefinidamente.
   */
  private async createWithUniqueUsername(
    input: {
      name: string;
      lastName: string;
      code: string;
      phone?: string;
      bio?: string;
      hireDate?: Date;
      contractType?: ContractType;
      contractEndDate?: Date;
    },
    passwordHash: string,
    userStatusId: number,
    employeeStatusId: number,
  ) {
    for (let attempt = 0; ; attempt++) {
      const username = await this.generateUsername(input.name, input.lastName);
      try {
        return await this.employeesRepository.createWithUser({
          username,
          name: input.name,
          lastName: input.lastName,
          passwordHash,
          userStatusId,
          code: input.code,
          phone: input.phone,
          bio: input.bio,
          hireDate: input.hireDate,
          contractType: input.contractType,
          contractEndDate: input.contractEndDate,
          employeeStatusId,
        });
      } catch (err) {
        const isUsernameCollision =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          (err.meta?.target as string[] | undefined)?.includes('username');
        if (!isUsernameCollision || attempt >= MAX_USERNAME_COLLISION_RETRIES) {
          throw err;
        }
      }
    }
  }

  private assertValidContract(
    contractType: ContractType | undefined,
    contractEndDate: Date | null | undefined,
  ) {
    if (contractType === 'INDEFINITE' && contractEndDate) {
      throw new BadRequestException(
        'An indefinite contract cannot have a contract end date',
      );
    }
  }

  private async generateUsername(
    name: string,
    lastName: string,
  ): Promise<string> {
    const candidates = UsernamePolicy.candidates(name, lastName);
    for (;;) {
      const { value: candidate } = candidates.next();
      if (!(await this.employeesRepository.usernameExists(candidate))) {
        return candidate;
      }
    }
  }

  async findAll(userId: number, query: FindEmployeesQueryDto) {
    const where: Prisma.EmployeeWhereInput = {};

    if (query.status) {
      const status = await this.statusesService.getRequired(
        EMPLOYEE_STATUS_GROUP,
        query.status.toUpperCase(),
      );
      where.statusId = status.id;
    }

    if (query.search) {
      where.OR = [
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    await this.applyReadScope(userId, where);

    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      this.employeesRepository.findMany(where, skip, query.limit),
      this.employeesRepository.count(where),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async findById(userId: number, id: number) {
    const employee = await this.getByIdOrThrow(id);
    await this.assertEmployeeScope(userId, 'employees:read', id);
    return employee;
  }

  async findByUserId(userId: number) {
    const employee = await this.employeesRepository.findByUserId(userId);
    if (!employee) {
      throw new NotFoundException('No employee profile linked to this account');
    }
    return employee;
  }

  async update(
    userId: number,
    id: number,
    data: {
      name?: string;
      lastName?: string;
      code?: string;
      phone?: string;
      bio?: string;
      hireDate?: Date;
      contractType?: ContractType;
      contractEndDate?: Date | null;
    },
  ) {
    const employee = await this.getByIdOrThrow(id);
    await this.assertEmployeeScope(userId, 'employees:update', id);

    if (
      data.code &&
      data.code !== employee.code &&
      (await this.employeesRepository.codeExists(data.code))
    ) {
      throw new ConflictException(
        `Employee code "${data.code}" is already in use`,
      );
    }

    const effectiveContractType = data.contractType ?? employee.contractType;
    const effectiveContractEndDate =
      data.contractEndDate !== undefined
        ? data.contractEndDate
        : employee.contractEndDate;
    this.assertValidContract(effectiveContractType, effectiveContractEndDate);

    const { name, lastName, ...employeeFields } = data;
    const userFields: { name?: string; lastName?: string } = {};
    if (name !== undefined) userFields.name = name;
    if (lastName !== undefined) userFields.lastName = lastName;

    return this.employeesRepository.updateProfile(
      id,
      employee.userId,
      userFields,
      employeeFields,
    );
  }

  async updateMyProfile(
    userId: number,
    data: {
      photoUrl?: string | null;
      phone?: string | null;
      bio?: string | null;
    },
  ) {
    const employee = await this.findByUserId(userId);

    const { photoUrl, ...employeeFields } = data;
    const userFields: { photoUrl?: string | null } = {};
    if (photoUrl !== undefined) userFields.photoUrl = photoUrl;

    return this.employeesRepository.updateProfile(
      employee.id,
      userId,
      userFields,
      employeeFields,
    );
  }

  async activate(userId: number, id: number) {
    // Existencia antes que alcance — mismo orden que findById/update, para no
    // devolver 403 en vez de 404 cuando el id ni siquiera existe.
    await this.getByIdOrThrow(id);
    await this.assertEmployeeScope(userId, 'employees:activate', id);
    return this.setLifecycle(id, 'ACTIVE', 'ACTIVE', null);
  }

  async deactivate(userId: number, id: number) {
    await this.getByIdOrThrow(id);
    await this.assertEmployeeScope(userId, 'employees:deactivate', id);
    return this.setLifecycle(id, 'INACTIVE', 'INACTIVE', null);
  }

  async terminate(userId: number, id: number) {
    await this.getByIdOrThrow(id);
    await this.assertEmployeeScope(userId, 'employees:terminate', id);
    return this.setLifecycle(id, 'TERMINATED', 'INACTIVE', new Date());
  }

  private async setLifecycle(
    id: number,
    employeeStatusCode: string,
    userStatusCode: string,
    terminationDate: Date | null,
  ) {
    const employee = await this.getByIdOrThrow(id);

    if (
      employeeStatusCode === 'TERMINATED' &&
      employee.status.code === 'TERMINATED'
    ) {
      throw new BadRequestException('Employee is already terminated');
    }

    const [employeeStatus, userStatus] = await Promise.all([
      this.statusesService.getRequired(
        EMPLOYEE_STATUS_GROUP,
        employeeStatusCode,
      ),
      this.statusesService.getRequired(USER_STATUS_GROUP, userStatusCode),
    ]);

    return this.employeesRepository.setLifecycleStatus(
      id,
      employee.userId,
      employeeStatus.id,
      userStatus.id,
      terminationDate,
    );
  }

  private async getByIdOrThrow(id: number) {
    const employee = await this.employeesRepository.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  /**
   * Un Employee puede tener varias Position activas simultáneas (spec 0013),
   * en departamentos distintos. Está dentro del alcance si AL MENOS UNA de
   * sus posiciones activas matchea — no bloquea a un manager legítimo de una
   * posición solo porque el empleado también tenga otra fuera de su alcance.
   * Sin posiciones activas, solo un alcance GLOBAL puede operar sobre él.
   */
  private async assertEmployeeScope(
    userId: number,
    permission: string,
    employeeId: number,
  ): Promise<void> {
    const grant = await this.permissionsService.getScopeGrant(
      userId,
      permission,
    );
    if (grant.global) return;

    const positions =
      await this.employeesRepository.findActivePositions(employeeId);
    const targets: ScopeTarget[] = positions.map((position) => ({
      companyId: position.department.companyId,
      departmentId: position.departmentId,
      zoneId: position.zoneId,
      jobTitleId: position.jobTitleId,
    }));

    const allowed = targets.some((target) =>
      this.permissionsService.grantCoversTarget(grant, target),
    );
    if (!allowed) {
      throw new ForbiddenException(
        `You do not have permission "${permission}" for this scope`,
      );
    }
  }

  private async applyReadScope(
    userId: number,
    where: Prisma.EmployeeWhereInput,
  ): Promise<void> {
    const grant = await this.permissionsService.getScopeGrant(
      userId,
      'employees:read',
    );
    if (grant.global) return;

    const positionOr: Prisma.PositionWhereInput[] = [];
    if (grant.companyIds.length > 0) {
      positionOr.push({ department: { companyId: { in: grant.companyIds } } });
    }
    if (grant.zoneIds.length > 0)
      positionOr.push({ zoneId: { in: grant.zoneIds } });
    if (grant.departmentIds.length > 0)
      positionOr.push({ departmentId: { in: grant.departmentIds } });
    if (grant.jobTitleIds.length > 0)
      positionOr.push({ jobTitleId: { in: grant.jobTitleIds } });

    if (positionOr.length === 0) {
      where.id = { in: [] };
    } else {
      where.positions = { some: { endDate: null, OR: positionOr } };
    }
  }
}
