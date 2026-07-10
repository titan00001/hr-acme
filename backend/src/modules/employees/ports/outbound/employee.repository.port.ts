import { EmployeeStatus } from '../../../../common/enums/employee-status.enum';
import { EmploymentType } from '../../../../common/enums/employment-type.enum';
import type { Employee } from '../../domain/employee.model';

export interface EmployeeListQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  country?: string;
}

export interface EmployeeListResult {
  data: Employee[];
  total: number;
}

export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY');

export interface EmployeeRepositoryPort {
  findById(id: string): Promise<Employee | null>;
  findByEmployeeId(employeeId: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findMany(query: EmployeeListQuery): Promise<EmployeeListResult>;
  save(employee: Employee): Promise<Employee>;
  update(employee: Employee): Promise<Employee>;
}
