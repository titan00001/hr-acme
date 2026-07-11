export const DISPLAY_CURRENCY_ORIGINAL = 'original';

export interface CurrencyBreakdown {
  currency: string;
  totalPayroll: number;
  averageCompensation: number;
  employeeCount: number;
}

export interface DashboardSummary {
  displayCurrency: string;
  activeEmployeeCount: number;
  totalPayroll: number | null;
  averageCompensation: number | null;
  byCurrency?: CurrencyBreakdown[];
}

export interface CountryBreakdown {
  country: string;
  payroll: number;
  headcount: number;
  currency: string;
}

export interface DistributionBucket {
  range: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  totalPayroll: number;
  currency?: string;
}

export interface RecentRevision {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  effectiveDate: string;
  currency: string;
  totalCompensation: string;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface PaginatedRecentRevisions {
  data: RecentRevision[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardCurrencyQuery {
  displayCurrency?: string;
}

export interface DashboardTrendsQuery extends DashboardCurrencyQuery {
  from: string;
  to: string;
}

export interface DashboardRecentQuery {
  page?: number;
  limit?: number;
}

/** Mirrors backend DashboardReconcileResponseDto */
export interface DashboardReconcileResult {
  countries: number;
  trends: number;
}

