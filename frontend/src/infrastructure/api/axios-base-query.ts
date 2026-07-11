import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosRequestConfig } from 'axios';

import { axiosClient } from '@/infrastructure/api/axios-client';
import { logout } from '@/infrastructure/store/auth-slice';
import type { RootState } from '@/infrastructure/store/store';

export type AxiosBaseQueryArgs = {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
};

export type AxiosBaseQueryError = {
  status?: number;
  data?: unknown;
};

export const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, AxiosBaseQueryError> =>
  async ({ url, method = 'GET', data, params, headers }, api) => {
    const state = api.getState() as RootState;
    const token = state.auth.token;

    try {
      const result = await axiosClient({
        url,
        method,
        data,
        params,
        headers: {
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      return { data: result.data };
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401 && token) {
        api.dispatch(logout());
        window.location.assign('/login');
      }

      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data ?? axiosError.message,
        },
      };
    }
  };
