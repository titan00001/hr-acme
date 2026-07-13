export interface MigrationCandidate {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  country: string;
  currentTemplateId: string;
  currentTemplateVersion: number;
  currentSalary: {
    totalCompensation: string;
    currency: string;
  } | null;
}
