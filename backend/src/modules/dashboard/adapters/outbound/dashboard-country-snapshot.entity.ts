import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('dashboard_country_snapshots')
export class DashboardCountrySnapshotEntity {
  @PrimaryColumn({ type: 'varchar' })
  country!: string;

  @PrimaryColumn({ name: 'base_currency', type: 'varchar' })
  baseCurrency!: string;

  @Column({ name: 'total_payroll', type: 'decimal', precision: 20, scale: 4 })
  totalPayroll!: string;

  @Column({ type: 'int' })
  headcount!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
