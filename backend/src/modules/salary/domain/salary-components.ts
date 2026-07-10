export interface SalaryStockComponent {
  quantity: number;
  vestingDate?: string;
}

export interface SalaryComponents {
  allowances?: number;
  bonus?: number;
  stock?: SalaryStockComponent;
}
