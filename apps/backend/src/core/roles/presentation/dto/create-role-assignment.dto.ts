import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ScopeType } from '../../../../../generated/prisma/client';

export class CreateRoleAssignmentDto {
  @IsInt()
  userId!: number;

  @IsInt()
  roleId!: number;

  @IsEnum(ScopeType)
  scopeType!: ScopeType;

  @IsOptional()
  @IsInt()
  scopeId?: number;
}
