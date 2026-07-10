import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CurrencyBreakdownDto {
  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ example: 2500000 })
  totalPayroll!: number;

  @ApiProperty({ example: 1250000 })
  averageCompensation!: number;

  @ApiProperty({ example: 2 })
  employeeCount!: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ example: 'original' })
  displayCurrency!: string;

  @ApiProperty({ example: 10 })
  activeEmployeeCount!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Set when displayCurrency is a specific currency',
    example: 5000000,
  })
  totalPayroll!: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Set when displayCurrency is a specific currency',
    example: 500000,
  })
  averageCompensation!: number | null;

  @ApiPropertyOptional({
    type: [CurrencyBreakdownDto],
    description: 'Present when displayCurrency=original',
  })
  byCurrency?: CurrencyBreakdownDto[];
}

export class CountryBreakdownDto {
  @ApiProperty({ example: 'India' })
  country!: string;

  @ApiProperty({ example: 2500000 })
  payroll!: number;

  @ApiProperty({ example: 2 })
  headcount!: number;

  @ApiProperty({ example: 'INR' })
  currency!: string;
}

export class DistributionBucketDto {
  @ApiProperty({ example: '0–500,000' })
  range!: string;

  @ApiProperty({ example: 3 })
  count!: number;
}

export class TrendPointDto {
  @ApiProperty({ example: '2026-01-15' })
  date!: string;

  @ApiProperty({ example: 1200000 })
  totalPayroll!: number;

  @ApiPropertyOptional({
    example: 'USD',
    description: 'Omitted or per-point currency when original',
  })
  currency?: string;
}

export class RecentRevisionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  employeeName!: string;

  @ApiProperty()
  employeeCode!: string;

  @ApiProperty()
  effectiveDate!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  totalCompensation!: string;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;
}
