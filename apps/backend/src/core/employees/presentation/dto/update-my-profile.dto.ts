import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

// `@IsOptional()` deja pasar sin validar tanto `undefined` (no tocar el
// campo) como `null` (borrarlo explícitamente) — solo valida el formato
// cuando el campo viene con un valor real.
export class UpdateMyProfileDto {
  @IsOptional()
  @IsUrl()
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;
}
