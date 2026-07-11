import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

import { AUTH_TOKEN_KEY } from '@/infrastructure/store/auth-slice';

beforeEach(() => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
});
