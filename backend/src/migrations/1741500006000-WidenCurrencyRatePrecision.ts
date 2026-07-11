import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenCurrencyRatePrecision1741500006000 implements MigrationInterface {
  name = 'WidenCurrencyRatePrecision1741500006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE currency_rates
      ALTER COLUMN rate TYPE DECIMAL(18, 8)
      USING rate::DECIMAL(18, 8)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE currency_rates
      ALTER COLUMN rate TYPE DECIMAL(10, 6)
      USING rate::DECIMAL(10, 6)
    `);
  }
}
