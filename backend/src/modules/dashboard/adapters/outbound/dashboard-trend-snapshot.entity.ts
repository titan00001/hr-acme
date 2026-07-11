import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('dashboard_trend_snapshots')
export class DashboardTrendSnapshotEntity {
  @PrimaryColumn({ name: 'effective_date', type: 'date' })
  effectiveDate!: string;

  @PrimaryColumn({ name: 'base_currency', type: 'varchar' })
  baseCurrency!: string;

  @Column({ name: 'total_payroll', type: 'decimal', precision: 20, scale: 4 })
  totalPayroll!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
