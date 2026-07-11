import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardSnapshots1741500007000 implements MigrationInterface {
  name = 'CreateDashboardSnapshots1741500007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE dashboard_country_snapshots (
        country VARCHAR NOT NULL,
        base_currency VARCHAR NOT NULL,
        total_payroll DECIMAL(20,4) NOT NULL DEFAULT 0,
        headcount INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (country, base_currency)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE dashboard_trend_snapshots (
        effective_date DATE NOT NULL,
        base_currency VARCHAR NOT NULL,
        total_payroll DECIMAL(20,4) NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (effective_date, base_currency)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE dashboard_distribution_snapshots (
        bucket_index INT PRIMARY KEY,
        label VARCHAR NOT NULL,
        lower_bound DECIMAL(20,4) NOT NULL,
        upper_bound DECIMAL(20,4) NULL,
        count INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO dashboard_distribution_snapshots
        (bucket_index, label, lower_bound, upper_bound, count)
      VALUES
        (0, '0–50k', 0, 50000, 0),
        (1, '50k–100k', 50000, 100000, 0),
        (2, '100k–200k', 100000, 200000, 0),
        (3, '200k–500k', 200000, 500000, 0),
        (4, '500k+', 500000, NULL, 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS dashboard_distribution_snapshots`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS dashboard_trend_snapshots`);
    await queryRunner.query(`DROP TABLE IF EXISTS dashboard_country_snapshots`);
  }
}
