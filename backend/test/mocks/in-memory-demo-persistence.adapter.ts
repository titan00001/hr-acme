import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Employee } from '../../src/modules/employees/domain/employee.model';
import type { SalaryRecord } from '../../src/modules/salary/domain/salary-record.model';
import type { SalaryTemplate } from '../../src/modules/salary-templates/domain/salary-template.model';
import {
  DEMO_PAYMENT_CYCLE,
  buildDemoEmployees,
  buildDemoTemplates,
  buildSalaryTotals,
} from '../../src/modules/demo/application/demo-seed.factory';
import type {
  DemoPersistencePort,
  DemoSeedResult,
} from '../../src/modules/demo/ports/outbound/demo-persistence.port';

export interface InMemoryDemoStores {
  clearEmployees: () => void;
  clearDrafts: () => void;
  clearRecords: () => void;
  clearTemplates: () => void;
  countEmployees: () => number;
  seedEmployee: (employee: Employee) => void;
  seedRecord: (record: SalaryRecord) => void;
  seedTemplate: (template: SalaryTemplate) => void;
}

@Injectable()
export class InMemoryDemoPersistenceAdapter implements DemoPersistencePort {
  constructor(private readonly stores: InMemoryDemoStores) {}

  countEmployees(): Promise<number> {
    return Promise.resolve(this.stores.countEmployees());
  }

  clearAll(): Promise<void> {
    this.stores.clearDrafts();
    this.stores.clearRecords();
    this.stores.clearEmployees();
    this.stores.clearTemplates();
    return Promise.resolve();
  }

  seed(employeeCount: number, createdBy: string): Promise<DemoSeedResult> {
    const now = new Date();
    const templates = buildDemoTemplates(now);
    const employees = buildDemoEmployees(employeeCount, templates);

    for (const template of templates) {
      this.stores.seedTemplate({
        id: template.id,
        name: template.name,
        version: template.version,
        country: template.country,
        currency: template.currency,
        components: {
          basePay: template.basePay,
          allowances: Math.round(template.basePay * 0.05),
          bonus: Math.round(template.basePay * 0.1),
        },
        isAssigned: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const employee of employees) {
      let currentSalaryId = randomUUID();
      const initialTotal = buildSalaryTotals({
        baseSalary: employee.baseSalary,
        allowances: employee.allowances,
        bonus: employee.bonus,
      });

      this.stores.seedRecord({
        id: currentSalaryId,
        employeeId: employee.id,
        templateId: employee.templateId,
        effectiveDate: employee.joiningDate,
        baseSalary: employee.baseSalary.toFixed(2),
        currency: employee.currency,
        paymentCycle: DEMO_PAYMENT_CYCLE,
        components: {
          allowances: employee.allowances,
          bonus: employee.bonus,
        },
        totalCompensation: initialTotal,
        stockPriceAtEntry: null,
        stockPriceCurrencyAtEntry: null,
        stockValueInStockCurrency: null,
        stockValueInSalaryCurrency: null,
        fxRateUsed: null,
        reason: 'Initial assignment',
        createdBy,
        createdAt: now,
        updatedAt: now,
      });

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
        const effectiveDate = shiftDate(employee.joiningDate, revision * 180);

        this.stores.seedRecord({
          id: revisionId,
          employeeId: employee.id,
          templateId: employee.templateId,
          effectiveDate,
          baseSalary: revisedBase.toFixed(2),
          currency: employee.currency,
          paymentCycle: DEMO_PAYMENT_CYCLE,
          components: {
            allowances: revisedAllowances,
            bonus: revisedBonus,
          },
          totalCompensation: buildSalaryTotals({
            baseSalary: revisedBase,
            allowances: revisedAllowances,
            bonus: revisedBonus,
          }),
          stockPriceAtEntry: null,
          stockPriceCurrencyAtEntry: null,
          stockValueInStockCurrency: null,
          stockValueInSalaryCurrency: null,
          fxRateUsed: null,
          reason: `Revision ${revision}`,
          createdBy,
          createdAt: now,
          updatedAt: now,
        });
        currentSalaryId = revisionId;
      }

      this.stores.seedEmployee({
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        country: employee.country,
        employmentType: employee.employmentType,
        status: employee.status,
        joiningDate: employee.joiningDate,
        currentSalaryId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return Promise.resolve({ inserted: employees.length });
  }
}

function shiftDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
