import { baseApi } from '@/infrastructure/api/base-api';
import type {
  MigrateFromTemplateRequest,
  MigrateFromTemplateResponse,
  PaginatedMigrationCandidates,
} from '@/domain/types/salary-template.types';
import type {
  PaginatedSalaryHistory,
  SalaryHistoryQuery,
} from '@/domain/types/salary.types';

export const salaryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalaryHistory: build.query<
      PaginatedSalaryHistory,
      { employeeId: string; query?: SalaryHistoryQuery }
    >({
      query: ({ employeeId, query }) => ({
        url: `/employees/${employeeId}/salary/history`,
        method: 'GET',
        params: query,
      }),
      providesTags: (_result, _error, { employeeId }) => [
        { type: 'Employee', id: `${employeeId}-history` },
      ],
    }),
    getMigrationCandidates: build.query<
      PaginatedMigrationCandidates,
      { templateId: string; page?: number; limit?: number }
    >({
      query: ({ templateId, page = 1, limit = 50 }) => ({
        url: `/salary-templates/${templateId}/migration-candidates`,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: (_result, _error, { templateId }) => [
        { type: 'SalaryTemplate', id: `${templateId}-candidates` },
      ],
    }),
    migrateFromTemplate: build.mutation<
      MigrateFromTemplateResponse,
      { templateId: string; body: MigrateFromTemplateRequest }
    >({
      query: ({ templateId, body }) => ({
        url: `/salary-templates/${templateId}/migrate`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, { templateId }) => [
        { type: 'SalaryDraft', id: 'LIST' },
        { type: 'SalaryTemplate', id: `${templateId}-candidates` },
        { type: 'SalaryTemplate', id: templateId },
        { type: 'SalaryTemplate', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetSalaryHistoryQuery,
  useGetMigrationCandidatesQuery,
  useMigrateFromTemplateMutation,
} = salaryApi;
