export interface TemplateStockComponent {
  quantity: number;
  vestingDate?: string;
}

export interface TemplateComponents {
  basePay: number;
  allowances?: number;
  bonus?: number;
  stock?: TemplateStockComponent;
}

export interface SalaryTemplate {
  id: string;
  name: string;
  version: number;
  country: string;
  currency: string;
  components: TemplateComponents;
  isAssigned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
