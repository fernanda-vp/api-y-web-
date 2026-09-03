import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class FindEmployeesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['active', 'inactive', 'terminated'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
