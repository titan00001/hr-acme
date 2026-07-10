import { ApiProperty } from '@nestjs/swagger';
import { EmployeeStatus } from '../../../../common/enums/employee-status.enum';
import { EmploymentType } from '../../../../common/enums/employment-type.enum';

export class EmployeeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'E001' })
  employeeId!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name!: string;

  @ApiProperty({ example: 'ada@example.com' })
  email!: string;

  @ApiProperty({ example: 'India' })
  country!: string;

  @ApiProperty({ enum: EmploymentType })
  employmentType!: EmploymentType;

  @ApiProperty({ enum: EmployeeStatus })
  status!: EmployeeStatus;

  @ApiProperty({ example: '2026-01-15' })
  joiningDate!: string;

  @ApiProperty({ example: null, nullable: true })
  currentSalaryId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
