import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentCycle } from '../../../../common/enums/payment-cycle.enum';

export class SalaryStockComponentDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({ example: '2027-01-01' })
  @IsOptional()
  @IsDateString()
  vestingDate?: string;
}

export class SalaryComponentsDto {
  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @ApiPropertyOptional({ type: SalaryStockComponentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryStockComponentDto)
  stock?: SalaryStockComponentDto;
}

export class UpsertSalaryDraftDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  templateId?: string | null;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  effectiveDate!: string;

  @ApiProperty({ example: 1200000 })
  @IsNumber()
  @Min(0)
  baseSalary!: number;

  @ApiProperty({ example: 'INR' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ enum: PaymentCycle, example: PaymentCycle.Monthly })
  @IsEnum(PaymentCycle)
  paymentCycle!: PaymentCycle;

  @ApiPropertyOptional({ type: SalaryComponentsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryComponentsDto)
  components?: SalaryComponentsDto;

  @ApiPropertyOptional({ example: 'Annual revision' })
  @IsOptional()
  @IsString()
  reason?: string;
}
