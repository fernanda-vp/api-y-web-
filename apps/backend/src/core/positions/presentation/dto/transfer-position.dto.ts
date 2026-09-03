import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional } from 'class-validator';

export class TransferPositionDto {
  @IsInt()
  jobTitleId!: number;

  @IsInt()
  departmentId!: number;

  @IsInt()
  zoneId!: number;

  @IsOptional()
  @IsInt()
  managerPositionId?: number;

  @IsOptional()
  @IsInt()
  functionalManagerPositionId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;
}
