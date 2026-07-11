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

/** Mirrors backend TemplateResponseDto */
export interface SalaryTemplate {
  id: string;
  name: string;
  version: number;
  country: string;
  currency: string;
  components: TemplateComponents;
  isAssigned: boolean;
  latestVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  country?: string;
  currency?: string;
}

export interface PaginatedTemplates {
  data: SalaryTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
