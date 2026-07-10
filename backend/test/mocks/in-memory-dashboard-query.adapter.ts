import { Injectable } from '@nestjs/common';
import { EmployeeStatus } from '../../src/common/enums/employee-status.enum';
import type { Employee } from '../../src/modules/employees/domain/employee.model';
import type { SalaryRecord } from '../../src/modules/salary/domain/salary-record.model';
import type {
  ActiveCurrentSalaryRow,
  DashboardQueryPort,
  RecentRevisionResult,
  TrendSalaryRow,
} from '../../src/modules/dashboard/ports/outbound/dashboard-query.port';

@Injectable()
export class InMemoryDashboardQueryAdapter implements DashboardQueryPort {
  constructor(
    private readonly getEmployees: () => Employee[],
    private readonly getRecords: () => SalaryRecord[],
  ) {}

  findActiveCurrentSalaries(): Promise<ActiveCurrentSalaryRow[]> {
    const employees = this.getEmployees().filter(
      (row) => row.status === EmployeeStatus.Active && row.currentSalaryId,
    );
    const records = this.getRecords();
    const rows: ActiveCurrentSalaryRow[] = [];

    for (const employee of employees) {
      const record = records.find((row) => row.id === employee.currentSalaryId);
      if (!record) {
        continue;
      }
      rows.push({
        employeeId: employee.id,
        country: employee.country,
        currency: record.currency,
        totalCompensation: record.totalCompensation,
        recordId: record.id,
      });
    }

    return Promise.resolve(rows);
  }

  findActiveCommittedInRange(
    from: string,
    to: string,
  ): Promise<TrendSalaryRow[]> {
    const activeIds = new Set(
      this.getEmployees()
        .filter((row) => row.status === EmployeeStatus.Active)
        .map((row) => row.id),
    );

    const rows = this.getRecords()
      .filter(
        (row) =>
          activeIds.has(row.employeeId) &&
          row.effectiveDate >= from &&
          row.effectiveDate <= to,
      )
      .map((row) => ({
        effectiveDate: row.effectiveDate,
        currency: row.currency,
        totalCompensation: row.totalCompensation,
      }));

    return Promise.resolve(rows);
  }

  findRecentRevisions(
    page: number,
    limit: number,
  ): Promise<RecentRevisionResult> {
    const employees = this.getEmployees();
    const activeById = new Map(
      employees
        .filter((row) => row.status === EmployeeStatus.Active)
        .map((row) => [row.id, row]),
    );

    const rows = this.getRecords()
      .filter((row) => activeById.has(row.employeeId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((row) => {
        const employee = activeById.get(row.employeeId)!;
        return {
          id: row.id,
          employeeId: row.employeeId,
          employeeName: employee.name,
          employeeCode: employee.employeeId,
          effectiveDate: row.effectiveDate,
          currency: row.currency,
          totalCompensation: row.totalCompensation,
          reason: row.reason,
          createdBy: row.createdBy,
          createdAt: row.createdAt,
        };
      });

    const total = rows.length;
    const start = (page - 1) * limit;
    return Promise.resolve({
      total,
      data: rows.slice(start, start + limit),
    });
  }
}
