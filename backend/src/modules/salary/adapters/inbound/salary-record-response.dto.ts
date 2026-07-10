import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentCycle } from '../../../../common/enums/payment-cycle.enum';

export class SalaryRecordResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiPropertyOptional({ nullable: true })
  templateId!: string | null;

  @ApiProperty()
  effectiveDate!: string;

  @ApiProperty()
  baseSalary!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: PaymentCycle })
  paymentCycle!: PaymentCycle;

  @ApiProperty({ type: 'object', additionalProperties: true })
  components!: Record<string, unknown>;

  @ApiProperty()
  totalCompensation!: string;

  @ApiPropertyOptional({ nullable: true })
  stockPriceAtEntry!: string | null;

  @ApiPropertyOptional({ nullable: true })
  stockPriceCurrencyAtEntry!: string | null;

  @ApiPropertyOptional({ nullable: true })
  stockValueInStockCurrency!: string | null;

  @ApiPropertyOptional({ nullable: true })
  stockValueInSalaryCurrency!: string | null;

  @ApiPropertyOptional({ nullable: true })
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
