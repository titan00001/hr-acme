import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalaryRecords1741500004000 implements MigrationInterface {
  name = 'CreateSalaryRecords1741500004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE salary_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id),
        template_id UUID NULL REFERENCES salary_templates(id),
        effective_date DATE NOT NULL,
        base_salary DECIMAL(15,2) NOT NULL,
        currency VARCHAR NOT NULL,
        payment_cycle VARCHAR NOT NULL,
        components JSONB NOT NULL DEFAULT '{}'::jsonb,
        total_compensation DECIMAL(15,2) NOT NULL,
        stock_price_at_entry DECIMAL(15,2) NULL,
        stock_price_currency_at_entry VARCHAR NULL,
        stock_value_in_stock_currency DECIMAL(15,2) NULL,
        stock_value_in_salary_currency DECIMAL(15,2) NULL,
        fx_rate_used DECIMAL(10,6) NULL,
        reason VARCHAR NULL,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_salary_records_employee_effective
      ON salary_records (employee_id, effective_date DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE salary_records`);
  }
}
