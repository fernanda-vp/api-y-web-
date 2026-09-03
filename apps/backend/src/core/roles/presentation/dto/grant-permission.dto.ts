import { IsInt } from 'class-validator';

export class GrantPermissionDto {
  @IsInt()
  permissionId!: number;
}
