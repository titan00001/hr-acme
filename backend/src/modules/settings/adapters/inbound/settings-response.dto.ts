import { ApiProperty } from '@nestjs/swagger';

export class SettingsResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'USD' })
  baseCurrency!: string;

  @ApiProperty({ example: ['USD', 'GBP', 'INR', 'EUR', 'SGD'] })
  supportedCurrencies!: string[];

  @ApiProperty({ example: ['US', 'UK', 'India', 'Germany', 'Singapore'] })
  supportedCountries!: string[];

  @ApiProperty({ example: 100000 })
  totalStocks!: number;

  @ApiProperty({ example: 150 })
  stockPrice!: number;

  @ApiProperty({ example: 'USD' })
  stockPriceCurrency!: string;

  @ApiProperty({ example: null, nullable: true })
  lastFxSyncAt!: Date | null;
}
