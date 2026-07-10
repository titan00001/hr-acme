import type { Employee } from '../domain/employee.model';
import { EmployeeResponseDto } from '../adapters/inbound/employee-response.dto';

export function toEmployeeResponseDto(employee: Employee): EmployeeResponseDto {
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
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}
