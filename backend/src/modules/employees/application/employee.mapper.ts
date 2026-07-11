import type {
  CurrentSalarySummary,
  Employee,
  EmployeeListItem,
} from '../domain/employee.model';
import { EmployeeResponseDto } from '../adapters/inbound/employee-response.dto';

export function toEmployeeResponseDto(
  employee: Employee,
  currentSalary: CurrentSalarySummary | null = null,
): EmployeeResponseDto {
  return {
    id: employee.id,
    employeeId: employee.employeeId,
    name: employee.name,
    email: employee.email,
    country: employee.country,
    employmentType: employee.employmentType,
    status: employee.status,
    joiningDate: employee.joiningDate,
    currentSalaryId: employee.currentSalaryId,
    currentSalary,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

export function toEmployeeListResponseDto(
  item: EmployeeListItem,
): EmployeeResponseDto {
  return toEmployeeResponseDto(item, item.currentSalary);
}
