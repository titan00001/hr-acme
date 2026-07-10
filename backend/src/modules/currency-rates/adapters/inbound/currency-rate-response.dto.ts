import { ApiProperty } from '@nestjs/swagger';

export class CurrencyRateResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'USD' })
  baseCurrency!: string;

  @ApiProperty({ example: 'INR' })
  targetCurrency!: string;

  @ApiProperty({ example: 83.12 })
  rate!: number;

  @ApiProperty({ example: '2026-07-09T12:00:00.000Z' })
  syncedAt!: Date;
}
