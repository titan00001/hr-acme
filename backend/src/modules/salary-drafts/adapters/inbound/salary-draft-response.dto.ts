import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentCycle } from '../../../../common/enums/payment-cycle.enum';
import { SalaryComponentsDto } from './upsert-salary-draft.dto';

export class DraftEmployeeSummaryDto {
  @ApiProperty({ example: 'E001', description: 'Business employee code' })
  employeeId!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name!: string;

  @ApiProperty({ example: 'ada@example.com' })
  email!: string;
}

export class SalaryDraftResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    description: 'Employee UUID (use for /employees/:id links)',
  })
  employeeId!: string;

  @ApiProperty({
    type: DraftEmployeeSummaryDto,
    description: 'Employee identity for display (business id, name, email)',
  })
  employee!: DraftEmployeeSummaryDto;

  @ApiPropertyOptional({ nullable: true })
  templateId!: string | null;

  @ApiProperty({ example: '2026-04-01' })
  effectiveDate!: string;

  @ApiProperty({ example: '1200000.00' })
  baseSalary!: string;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ enum: PaymentCycle })
  paymentCycle!: PaymentCycle;

  @ApiProperty({ type: SalaryComponentsDto })
  components!: SalaryComponentsDto;

  @ApiPropertyOptional({ nullable: true, example: '150.00' })
  stockPriceAtEntry!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'USD' })
  stockPriceCurrencyAtEntry!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '15000.00' })
  stockValueInStockCurrency!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '1250000.00' })
  stockValueInSalaryCurrency!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '83.333333' })
  fxRateUsed!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty()
  createdBy!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
