import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateZoneDto {
  @IsInt()
  companyId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;
}
