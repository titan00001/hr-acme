import { PaymentCycle } from '../../../common/enums/payment-cycle.enum';
import type { SalaryComponents } from './salary-components';

export interface SalaryRecord {
  id: string;
  employeeId: string;
  templateId: string | null;
  effectiveDate: string;
  baseSalary: string;
  currency: string;
  paymentCycle: PaymentCycle;
  components: SalaryComponents;
  totalCompensation: string;
  stockPriceAtEntry: string | null;
  stockPriceCurrencyAtEntry: string | null;
  stockValueInStockCurrency: string | null;
  stockValueInSalaryCurrency: string | null;
  fxRateUsed: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
