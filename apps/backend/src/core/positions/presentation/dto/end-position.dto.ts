import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class EndPositionDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;
}
