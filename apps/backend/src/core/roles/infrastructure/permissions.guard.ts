import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../../auth/infrastructure/current-user.decorator';
import { PERMISSION_KEY } from '../presentation/require-permission.decorator';
import { RolesRepository } from './roles.repository';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesRepository: RolesRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<string | undefined>(
      PERMISSION_KEY,
      context.getHandler(),
    );
    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const granted = await this.rolesRepository.hasGrantingAssignment(
      request.user.userId,
      permission,
    );
    if (!granted) {
      throw new ForbiddenException(`Missing permission "${permission}"`);
    }
    return true;
  }
}
