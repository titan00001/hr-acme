import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployees1741500002000 implements MigrationInterface {
  name = 'CreateEmployees1741500002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL UNIQUE,
        country VARCHAR NOT NULL,
        employment_type VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'Active',
        joining_date DATE NOT NULL,
        current_salary_id UUID NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_employees_name ON employees (name)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_employees_email ON employees (email)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_employees_country ON employees (country)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_employees_status ON employees (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_employees_employment_type ON employees (employment_type)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_employees_country_status ON employees (country, status)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE employees`);
  }
}
