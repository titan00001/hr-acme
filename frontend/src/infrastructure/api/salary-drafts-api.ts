import { baseApi } from '@/infrastructure/api/base-api';
import type { SalaryRecord } from '@/domain/types/salary.types';
import type {
  SalaryDraft,
  UpsertSalaryDraftRequest,
} from '@/domain/types/salary.types';

export interface DraftListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedSalaryDrafts {
  data: SalaryDraft[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const salaryDraftsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalaryDrafts: build.query<PaginatedSalaryDrafts, DraftListQuery | void>({
      query: (params) => ({
        url: '/salary-drafts',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((draft) => ({
                type: 'SalaryDraft' as const,
                id: draft.id,
              })),
              { type: 'SalaryDraft', id: 'LIST' },
            ]
          : [{ type: 'SalaryDraft', id: 'LIST' }],
    }),
    getSalaryDraft: build.query<SalaryDraft, string>({
      query: (id) => ({
        url: `/salary-drafts/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'SalaryDraft', id }],
    }),
    upsertSalaryDraft: build.mutation<
      SalaryDraft,
      { employeeId: string; body: UpsertSalaryDraftRequest }
    >({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/salary/draft`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [
        { type: 'SalaryDraft', id: 'LIST' },
        'Employee',
      ],
    }),
    commitSalaryDraft: build.mutation<SalaryRecord, string>({
      query: (id) => ({
        url: `/salary-drafts/${id}/commit`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'SalaryDraft', id: 'LIST' },
        'Employee',
      ],
    }),
    rollbackSalaryDraft: build.mutation<void, string>({
      query: (id) => ({
        url: `/salary-drafts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'SalaryDraft', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSalaryDraftsQuery,
  useGetSalaryDraftQuery,
  useUpsertSalaryDraftMutation,
  useCommitSalaryDraftMutation,
  useRollbackSalaryDraftMutation,
} = salaryDraftsApi;
