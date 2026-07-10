import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCurrencyRates1741500001000 implements MigrationInterface {
  name = 'CreateCurrencyRates1741500001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE currency_rates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        base_currency VARCHAR NOT NULL,
        target_currency VARCHAR NOT NULL,
        rate DECIMAL(10,6) NOT NULL,
        synced_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_currency_rates_base_target UNIQUE (base_currency, target_currency)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE currency_rates`);
  }
}
