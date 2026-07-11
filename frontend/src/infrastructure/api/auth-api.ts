import { baseApi } from '@/infrastructure/api/base-api';
import type {
  LoginRequest,
  LoginResponse,
} from '@/domain/types/auth.types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        data: body,
      }),
    }),
  }),
});

export const { useLoginMutation } = authApi;
