import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettings1741500000000 implements MigrationInterface {
  name = 'CreateSettings1741500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE settings (
        id INT PRIMARY KEY,
        base_currency VARCHAR NOT NULL,
        supported_currencies JSONB NOT NULL,
        supported_countries JSONB NOT NULL,
        total_stocks INT NOT NULL,
        stock_price DECIMAL(15,2) NOT NULL,
        stock_price_currency VARCHAR NOT NULL,
        last_fx_sync_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO settings (
        id,
        base_currency,
        supported_currencies,
        supported_countries,
        total_stocks,
        stock_price,
        stock_price_currency,
        last_fx_sync_at
      ) VALUES (
        1,
        'USD',
        '["USD","GBP","INR","EUR","SGD"]',
        '["US","UK","India","Germany","Singapore"]',
        100000,
        150.00,
        'USD',
        NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE settings`);
  }
}
