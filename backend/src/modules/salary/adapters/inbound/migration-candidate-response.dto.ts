import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrentSalarySummaryDto } from '../../../employees/adapters/inbound/employee-response.dto';

export class MigrationCandidateResponseDto {
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

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  currentTemplateId!: string;

  @ApiProperty({ example: 1 })
  currentTemplateVersion!: number;

  @ApiPropertyOptional({
    type: CurrentSalarySummaryDto,
    nullable: true,
  })
  currentSalary!: CurrentSalarySummaryDto | null;
}

export class MigrationCandidatesResponseDto {
  @ApiProperty({ type: [MigrationCandidateResponseDto] })
  data!: MigrationCandidateResponseDto[];

  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}
