import { Injectable } from '@nestjs/common';
import { EmployeeStatus } from '../../src/common/enums/employee-status.enum';
import type { Employee } from '../../src/modules/employees/domain/employee.model';
import type {
  EmployeeListQuery,
  EmployeeListResult,
  EmployeeRepositoryPort,
} from '../../src/modules/employees/ports/outbound/employee.repository.port';

@Injectable()
export class InMemoryEmployeeRepository implements EmployeeRepositoryPort {
  private employees: Employee[] = [];

  findById(id: string): Promise<Employee | null> {
    const employee = this.employees.find((row) => row.id === id);
    return Promise.resolve(employee ? { ...employee } : null);
  }

  findByEmployeeId(employeeId: string): Promise<Employee | null> {
    const employee = this.employees.find(
      (row) => row.employeeId === employeeId,
    );
    return Promise.resolve(employee ? { ...employee } : null);
  }

  findByEmail(email: string): Promise<Employee | null> {
    const employee = this.employees.find((row) => row.email === email);
    return Promise.resolve(employee ? { ...employee } : null);
  }

  findMany(query: EmployeeListQuery): Promise<EmployeeListResult> {
    let rows = [...this.employees];

    if (query.status) {
      rows = rows.filter((row) => row.status === query.status);
    }
    if (query.employmentType) {
      rows = rows.filter((row) => row.employmentType === query.employmentType);
    }
    if (query.country) {
      rows = rows.filter((row) => row.country === query.country);
    }
    if (query.search) {
      const search = query.search.toLowerCase();
      rows = rows.filter(
        (row) =>
          row.name.toLowerCase().includes(search) ||
          row.email.toLowerCase().includes(search) ||
          row.employeeId.toLowerCase().includes(search),
      );
    }

    const sortBy = query.sortBy ?? 'name';
    const sortOrder = query.sortOrder === 'DESC' ? -1 : 1;
    rows.sort((a, b) => {
      const left = String(a[sortBy as keyof Employee] ?? '');
      const right = String(b[sortBy as keyof Employee] ?? '');
      return left.localeCompare(right) * sortOrder;
    });

    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    const data = rows.slice(start, start + query.limit).map((row) => ({
      ...row,
    }));

    return Promise.resolve({ data, total });
  }

  save(employee: Employee): Promise<Employee> {
    this.employees.push({ ...employee });
    return Promise.resolve({ ...employee });
  }

  update(employee: Employee): Promise<Employee> {
    const index = this.employees.findIndex((row) => row.id === employee.id);
    if (index >= 0) {
      this.employees[index] = { ...employee };
    } else {
      this.employees.push({ ...employee });
    }
    return Promise.resolve({ ...employee });
  }

  clear(): void {
    this.employees = [];
  }

  seed(employee: Employee): void {
    this.employees.push({ ...employee });
  }

  countByStatus(status: EmployeeStatus): number {
    return this.employees.filter((row) => row.status === status).length;
  }
}
