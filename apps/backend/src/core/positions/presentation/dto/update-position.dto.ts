import { IsInt, IsOptional } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsInt()
  managerPositionId?: number | null;

  @IsOptional()
  @IsInt()
  functionalManagerPositionId?: number | null;
}
