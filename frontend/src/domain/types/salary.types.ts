export type PaymentCycle = 'Monthly' | 'BiWeekly' | 'Weekly' | 'Annual';

export const PAYMENT_CYCLES: PaymentCycle[] = [
  'Monthly',
  'BiWeekly',
  'Weekly',
  'Annual',
];

export interface SalaryStockComponent {
  quantity: number;
  vestingDate?: string;
}

export interface SalaryComponents {
  allowances?: number;
  bonus?: number;
  stock?: SalaryStockComponent;
}

export interface UpsertSalaryDraftRequest {
  templateId?: string | null;
  effectiveDate: string;
  baseSalary: number;
  currency: string;
  paymentCycle: PaymentCycle;
  components?: SalaryComponents;
  reason?: string;
}

/** Nested identity on draft responses (business code + display fields) */
export interface DraftEmployeeSummary {
  employeeId: string;
  name: string;
  email: string;
}

export interface SalaryDraft {
  id: string;
  /** Employee UUID — use for `/employees/:id` links */
  employeeId: string;
  employee: DraftEmployeeSummary;
  templateId: string | null;
  effectiveDate: string;
  baseSalary: string;
  currency: string;
  paymentCycle: PaymentCycle;
  components: SalaryComponents;
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
