import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address?: string;
}
