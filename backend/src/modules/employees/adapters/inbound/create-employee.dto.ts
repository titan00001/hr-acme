import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { EmploymentType } from '../../../../common/enums/employment-type.enum';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'E001' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ enum: EmploymentType, example: EmploymentType.Permanent })
  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  joiningDate!: string;
}
