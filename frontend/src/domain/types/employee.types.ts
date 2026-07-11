export type EmploymentType = 'Permanent' | 'PartTime' | 'Contract';

export type EmployeeStatus = 'Active' | 'Left';

export interface CurrentSalarySummary {
  totalCompensation: string;
  currency: string;
}

/** Mirrors backend EmployeeResponseDto */
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  country: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  joiningDate: string;
  currentSalaryId: string | null;
  currentSalary: CurrentSalarySummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  country?: string;
}

export interface PaginatedEmployees {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Permanent',
  'PartTime',
  'Contract',
];
