import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import {
  DEMO_BATCH_SIZE,
  DEMO_PAYMENT_CYCLE,
  buildDemoEmployees,
  buildDemoTemplates,
  buildSalaryTotals,
} from '../../application/demo-seed.factory';
import type {
  DemoPersistencePort,
  DemoSeedResult,
} from '../../ports/outbound/demo-persistence.port';

@Injectable()
export class TypeOrmDemoPersistenceAdapter implements DemoPersistencePort {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async countEmployees(): Promise<number> {
    const result = await this.dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM employees`,
    );
    return Number(result[0]?.count ?? 0);
  }

  async clearAll(): Promise<void> {
    await this.dataSource.query(`
      TRUNCATE salary_drafts, salary_records, employees, salary_templates
      RESTART IDENTITY CASCADE
    `);
  }

  async seed(
    employeeCount: number,
    createdBy: string,
  ): Promise<DemoSeedResult> {
    const now = new Date();
    const templates = buildDemoTemplates(now);
    const employees = buildDemoEmployees(employeeCount, templates);

    for (const template of templates) {
      await this.dataSource.query(
        `
        INSERT INTO salary_templates
          (id, name, version, country, currency, components, is_assigned, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6::jsonb, true, $7, $7)
        `,
        [
          template.id,
          template.name,
          template.version,
          template.country,
          template.currency,
          JSON.stringify({
            basePay: template.basePay,
            allowances: Math.round(template.basePay * 0.05),
            bonus: Math.round(template.basePay * 0.1),
          }),
          now,
        ],
      );
    }

    for (let offset = 0; offset < employees.length; offset += DEMO_BATCH_SIZE) {
      const batch = employees.slice(offset, offset + DEMO_BATCH_SIZE);
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        for (const employee of batch) {
          const currentSalaryId = randomUUID();
          const totalCompensation = buildSalaryTotals({
            baseSalary: employee.baseSalary,
            allowances: employee.allowances,
            bonus: employee.bonus,
          });

          await queryRunner.query(
            `
            INSERT INTO employees
              (id, employee_id, name, email, country, employment_type, status,
               joining_date, current_salary_id, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
            `,
            [
              employee.id,
              employee.employeeId,
              employee.name,
              employee.email,
              employee.country,
              employee.employmentType,
              employee.status,
              employee.joiningDate,
              currentSalaryId,
              now,
            ],
          );

          await queryRunner.query(
            `
            INSERT INTO salary_records
              (id, employee_id, template_id, effective_date, base_salary, currency, payment_cycle,
               components, total_compensation, stock_price_at_entry, stock_price_currency_at_entry,
               stock_value_in_stock_currency, stock_value_in_salary_currency, fx_rate_used,
               reason, created_by, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, NULL, NULL, NULL, NULL, NULL, $10, $11, $12, $12)
            `,
            [
              currentSalaryId,
              employee.id,
              employee.templateId,
              employee.joiningDate,
              employee.baseSalary.toFixed(2),
              employee.currency,
              DEMO_PAYMENT_CYCLE,
              JSON.stringify({
                allowances: employee.allowances,
                bonus: employee.bonus,
              }),
              totalCompensation,
              'Initial assignment',
              createdBy,
              now,
            ],
          );

          let activeSalaryId = currentSalaryId;
          for (
            let revision = 1;
            revision <= employee.extraRevisionCount;
            revision += 1
          ) {
            const revisionId = randomUUID();
            const revisedBase = Math.round(
              employee.baseSalary * (1 + 0.05 * revision),
            );
            const revisedAllowances = Math.round(revisedBase * 0.05);
            const revisedBonus = Math.round(revisedBase * 0.1);
            const effectiveDate = shiftDate(
              employee.joiningDate,
              revision * 180,
            );

            await queryRunner.query(
              `
              INSERT INTO salary_records
                (id, employee_id, template_id, effective_date, base_salary, currency, payment_cycle,
                 components, total_compensation, stock_price_at_entry, stock_price_currency_at_entry,
                 stock_value_in_stock_currency, stock_value_in_salary_currency, fx_rate_used,
                 reason, created_by, created_at, updated_at)
              VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, NULL, NULL, NULL, NULL, NULL, $10, $11, $12, $12)
              `,
              [
                revisionId,
                employee.id,
                employee.templateId,
                effectiveDate,
                revisedBase.toFixed(2),
                employee.currency,
                DEMO_PAYMENT_CYCLE,
                JSON.stringify({
                  allowances: revisedAllowances,
                  bonus: revisedBonus,
                }),
                buildSalaryTotals({
                  baseSalary: revisedBase,
                  allowances: revisedAllowances,
                  bonus: revisedBonus,
                }),
                `Revision ${revision}`,
                createdBy,
                now,
              ],
            );
            activeSalaryId = revisionId;
          }

          if (activeSalaryId !== currentSalaryId) {
            await queryRunner.query(
              `UPDATE employees SET current_salary_id = $1, updated_at = $2 WHERE id = $3`,
              [activeSalaryId, now, employee.id],
            );
          }
        }

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    return { inserted: employees.length };
  }
}

function shiftDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
