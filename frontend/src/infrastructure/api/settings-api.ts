import { baseApi } from '@/infrastructure/api/base-api';
import type { Settings } from '@/domain/types/settings.types';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<Settings, void>({
      query: () => ({
        url: '/settings',
        method: 'GET',
      }),
      providesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery } = settingsApi;
