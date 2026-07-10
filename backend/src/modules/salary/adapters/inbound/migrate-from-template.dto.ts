import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  PRESERVE_SALARY_FIELDS,
  type PreserveSalaryField,
} from '../../domain/preserve-salary-field';

export class MigrateFromTemplateDto {
  @ApiProperty({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  employeeIds!: string[];

  @ApiProperty({
    enum: PRESERVE_SALARY_FIELDS,
    isArray: true,
    example: ['baseSalary'],
  })
  @IsArray()
  @IsIn(PRESERVE_SALARY_FIELDS, { each: true })
  preserveFields!: PreserveSalaryField[];

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  effectiveDate!: string;

  @ApiPropertyOptional({ example: 'Migrate to template v2' })
  @IsOptional()
  @IsString()
  reason?: string;
}
