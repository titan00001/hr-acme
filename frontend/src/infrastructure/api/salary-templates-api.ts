import { baseApi } from '@/infrastructure/api/base-api';
import type {
  CreateTemplateRequest,
  CreateTemplateVersionRequest,
  PaginatedTemplates,
  SalaryTemplate,
  TemplateQuery,
  UpdateTemplateRequest,
} from '@/domain/types/salary-template.types';

export const salaryTemplatesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalaryTemplates: build.query<PaginatedTemplates, TemplateQuery | void>({
      query: (params) => ({
        url: '/salary-templates',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((template) => ({
                type: 'SalaryTemplate' as const,
                id: template.id,
              })),
              { type: 'SalaryTemplate', id: 'LIST' },
            ]
          : [{ type: 'SalaryTemplate', id: 'LIST' }],
    }),
    getSalaryTemplate: build.query<SalaryTemplate, string>({
      query: (id) => ({
        url: `/salary-templates/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'SalaryTemplate', id }],
    }),
    createSalaryTemplate: build.mutation<SalaryTemplate, CreateTemplateRequest>({
      query: (body) => ({
        url: '/salary-templates',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'SalaryTemplate', id: 'LIST' }],
    }),
    updateSalaryTemplate: build.mutation<
      SalaryTemplate,
      { id: string; body: UpdateTemplateRequest }
    >({
      query: ({ id, body }) => ({
        url: `/salary-templates/${id}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'SalaryTemplate', id },
        { type: 'SalaryTemplate', id: 'LIST' },
      ],
    }),
    deleteSalaryTemplate: build.mutation<void, string>({
      query: (id) => ({
        url: `/salary-templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'SalaryTemplate', id },
        { type: 'SalaryTemplate', id: 'LIST' },
      ],
    }),
    createSalaryTemplateVersion: build.mutation<
      SalaryTemplate,
      { id: string; body: CreateTemplateVersionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/salary-templates/${id}/versions`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'SalaryTemplate', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSalaryTemplatesQuery,
  useGetSalaryTemplateQuery,
  useCreateSalaryTemplateMutation,
  useUpdateSalaryTemplateMutation,
  useDeleteSalaryTemplateMutation,
  useCreateSalaryTemplateVersionMutation,
} = salaryTemplatesApi;
