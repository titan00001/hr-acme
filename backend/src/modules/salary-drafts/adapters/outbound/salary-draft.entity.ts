import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../../common/database/base.entity';
import { PaymentCycle } from '../../../../common/enums/payment-cycle.enum';
import type { SalaryComponents } from '../../../salary/domain/salary-components';

@Entity('salary_drafts')
@Unique(['employeeId'])
@Index(['employeeId'])
export class SalaryDraftEntity extends BaseEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId!: string | null;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate!: string;

  @Column({ name: 'base_salary', type: 'decimal', precision: 15, scale: 2 })
  baseSalary!: string;

  @Column({ type: 'varchar' })
  currency!: string;

  @Column({ name: 'payment_cycle', type: 'varchar' })
  paymentCycle!: PaymentCycle;

  @Column({ type: 'jsonb', default: {} })
  components!: SalaryComponents;

  @Column({
    name: 'stock_price_at_entry',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  stockPriceAtEntry!: string | null;

  @Column({
    name: 'stock_price_currency_at_entry',
    type: 'varchar',
    nullable: true,
  })
  stockPriceCurrencyAtEntry!: string | null;

  @Column({
    name: 'stock_value_in_stock_currency',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  stockValueInStockCurrency!: string | null;

  @Column({
    name: 'stock_value_in_salary_currency',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  stockValueInSalaryCurrency!: string | null;

  @Column({
    name: 'fx_rate_used',
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
  })
  fxRateUsed!: string | null;

  @Column({ type: 'varchar', nullable: true })
  reason!: string | null;

  @Column({ name: 'created_by', type: 'varchar' })
  createdBy!: string;
}
