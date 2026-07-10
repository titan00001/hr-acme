import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { EmploymentType } from '../../../common/enums/employment-type.enum';

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
  createdAt: Date;
  updatedAt: Date;
}
