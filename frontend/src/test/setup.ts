import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

import { AUTH_TOKEN_KEY } from '@/infrastructure/store/auth-slice';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverStub;

beforeEach(() => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
});
