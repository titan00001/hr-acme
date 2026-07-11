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
  search?: string;
  country?: string;
  currency?: string;
  isAssigned?: boolean;
}

export interface PaginatedTemplates {
  data: SalaryTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Mirrors backend CreateTemplateDto */
export interface CreateTemplateRequest {
  name: string;
  country: string;
  currency: string;
  components: TemplateComponents;
}

/** Mirrors backend UpdateTemplateDto */
export interface UpdateTemplateRequest {
  country?: string;
  currency?: string;
  components?: TemplateComponents;
}

/** Mirrors backend CreateTemplateVersionDto */
export interface CreateTemplateVersionRequest {
  name?: string;
  country: string;
  currency: string;
  components: TemplateComponents;
}
