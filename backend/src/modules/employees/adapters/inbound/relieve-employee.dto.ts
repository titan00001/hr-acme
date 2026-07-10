import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RelieveEmployeeDto {
  @ApiPropertyOptional({ example: 'Resigned' })
  @IsOptional()
  @IsString()
  reason?: string;
}
