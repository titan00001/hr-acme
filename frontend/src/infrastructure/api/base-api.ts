import { createApi } from '@reduxjs/toolkit/query/react';

import { axiosBaseQuery } from '@/infrastructure/api/axios-base-query';

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    'Employee',
    'SalaryDraft',
    'SalaryTemplate',
    'Dashboard',
    'Settings',
    'CurrencyRate',
  ],
  endpoints: () => ({}),
});
