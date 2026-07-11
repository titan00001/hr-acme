import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('dashboard_distribution_snapshots')
export class DashboardDistributionSnapshotEntity {
  @PrimaryColumn({ name: 'bucket_index', type: 'int' })
  bucketIndex!: number;

  @Column({ type: 'varchar' })
  label!: string;

  @Column({ name: 'lower_bound', type: 'decimal', precision: 20, scale: 4 })
  lowerBound!: string;

  @Column({
    name: 'upper_bound',
    type: 'decimal',
    precision: 20,
    scale: 4,
    nullable: true,
  })
  upperBound!: string | null;

  @Column({ type: 'int', default: 0 })
  count!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
