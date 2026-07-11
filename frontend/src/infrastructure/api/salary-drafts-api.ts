import { baseApi } from '@/infrastructure/api/base-api';
import type {
  SalaryDraft,
  UpsertSalaryDraftRequest,
} from '@/domain/types/salary.types';

export const salaryDraftsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    upsertSalaryDraft: build.mutation<
      SalaryDraft,
      { employeeId: string; body: UpsertSalaryDraftRequest }
    >({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/salary/draft`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['SalaryDraft', 'Employee'],
    }),
  }),
});

export const { useUpsertSalaryDraftMutation } = salaryDraftsApi;
