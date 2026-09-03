import { ArrayNotEmpty, IsArray, IsBoolean, IsInt } from 'class-validator';

export class BulkSetPermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  permissionIds!: number[];

  @IsBoolean()
  grant!: boolean;
}
