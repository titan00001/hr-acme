export type PaymentCycle = 'Monthly' | 'BiWeekly' | 'Weekly' | 'Annual';

/** Mirrors backend SalaryRecordResponseDto */
export interface SalaryRecord {
  id: string;
  employeeId: string;
  templateId: string | null;
  effectiveDate: string;
  baseSalary: string;
  currency: string;
  paymentCycle: PaymentCycle;
  components: Record<string, unknown>;
  totalCompensation: string;
  stockPriceAtEntry: string | null;
  stockPriceCurrencyAtEntry: string | null;
  stockValueInStockCurrency: string | null;
  stockValueInSalaryCurrency: string | null;
  fxRateUsed: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryHistoryQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedSalaryHistory {
  data: SalaryRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
