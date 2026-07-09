import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('settings')
export class SettingsEntity {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'base_currency', type: 'varchar' })
  baseCurrency!: string;

  @Column({ name: 'supported_currencies', type: 'jsonb' })
  supportedCurrencies!: string[];

  @Column({ name: 'supported_countries', type: 'jsonb' })
  supportedCountries!: string[];

  @Column({ name: 'total_stocks', type: 'int' })
  totalStocks!: number;

  @Column({ name: 'stock_price', type: 'decimal', precision: 15, scale: 2 })
  stockPrice!: string;

  @Column({ name: 'stock_price_currency', type: 'varchar' })
  stockPriceCurrency!: string;

  @Column({ name: 'last_fx_sync_at', type: 'timestamptz', nullable: true })
  lastFxSyncAt!: Date | null;
}
