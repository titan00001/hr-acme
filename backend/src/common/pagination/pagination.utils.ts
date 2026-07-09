import type { SortOrder } from './pagination-query.dto';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SafeOrderByResult {
  field: string;
  order: SortOrder;
  alias?: string;
}

export function getPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const safeLimit = limit > 0 ? limit : 1;
  const safePage = page > 0 ? page : 1;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
  };
}

export function safeOrderBy(
  sortBy: string | undefined,
  sortOrder: SortOrder | undefined,
  allowedFields: readonly string[],
  alias?: string,
): SafeOrderByResult | null {
  if (!sortBy || !allowedFields.includes(sortBy)) {
    return null;
  }

  const order: SortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';

  return {
    field: sortBy,
    order,
    alias,
  };
}
