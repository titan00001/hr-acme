import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalaryTemplates1741500003000 implements MigrationInterface {
  name = 'CreateSalaryTemplates1741500003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE salary_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        version INT NOT NULL DEFAULT 1,
        country VARCHAR NOT NULL,
        currency VARCHAR NOT NULL,
        components JSONB NOT NULL,
        is_assigned BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_salary_templates_name_version UNIQUE (name, version)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_salary_templates_name ON salary_templates (name)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_salary_templates_country ON salary_templates (country)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_salary_templates_currency ON salary_templates (currency)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE salary_templates`);
  }
}
