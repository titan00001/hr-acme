import { baseApi } from '@/infrastructure/api/base-api';
import type {
  Settings,
  UpdateSettingsRequest,
} from '@/domain/types/settings.types';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<Settings, void>({
      query: () => ({
        url: '/settings',
        method: 'GET',
      }),
      providesTags: ['Settings'],
    }),
    updateSettings: build.mutation<Settings, UpdateSettingsRequest>({
      query: (body) => ({
        url: '/settings',
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
