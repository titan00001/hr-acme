export interface ActiveCurrentSalaryRow {
  employeeId: string;
  country: string;
  currency: string;
  totalCompensation: string;
  recordId: string;
}

export interface TrendSalaryRow {
  effectiveDate: string;
  currency: string;
  totalCompensation: string;
}

export interface RecentRevisionRow {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  effectiveDate: string;
  currency: string;
  totalCompensation: string;
  reason: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface RecentRevisionResult {
  data: RecentRevisionRow[];
  total: number;
}

export const DASHBOARD_QUERY = Symbol('DASHBOARD_QUERY');

export interface DashboardQueryPort {
  findActiveCurrentSalaries(): Promise<ActiveCurrentSalaryRow[]>;
  findActiveCommittedInRange(
    from: string,
    to: string,
  ): Promise<TrendSalaryRow[]>;
  findRecentRevisions(
    page: number,
    limit: number,
  ): Promise<RecentRevisionResult>;
}
