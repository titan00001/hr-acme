import { baseApi } from '@/infrastructure/api/base-api';
import type {
  PaginatedTemplates,
  SalaryTemplate,
  TemplateQuery,
} from '@/domain/types/salary-template.types';

export const salaryTemplatesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalaryTemplates: build.query<PaginatedTemplates, TemplateQuery | void>({
      query: (params) => ({
        url: '/salary-templates',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['SalaryTemplate'],
    }),
    getSalaryTemplate: build.query<SalaryTemplate, string>({
      query: (id) => ({
        url: `/salary-templates/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'SalaryTemplate', id }],
    }),
  }),
});

export const { useGetSalaryTemplatesQuery, useGetSalaryTemplateQuery } =
  salaryTemplatesApi;
