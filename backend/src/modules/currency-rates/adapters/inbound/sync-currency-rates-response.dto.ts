import { ApiProperty } from '@nestjs/swagger';

export class SyncCurrencyRatesResponseDto {
  @ApiProperty({ example: 162 })
  synced!: number;

  @ApiProperty({ example: '2026-07-09T12:00:00.000Z' })
  lastFxSyncAt!: Date;
}
