import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../../../common/database/base.entity';

@Entity('currency_rates')
@Unique(['baseCurrency', 'targetCurrency'])
export class CurrencyRateEntity extends BaseEntity {
  @Column({ name: 'base_currency', type: 'varchar' })
  baseCurrency!: string;

  @Column({ name: 'target_currency', type: 'varchar' })
  targetCurrency!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  rate!: string;

  @Column({ name: 'synced_at', type: 'timestamptz' })
  syncedAt!: Date;
}
