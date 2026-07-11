import { describe, expect, it } from 'vitest';

import {
  extractApiError,
  formatApiErrorMessage,
} from './extract-api-error';

describe('extractApiError', () => {
  it('reads status and Nest message from RTK/axios error shape', () => {
    expect(
      extractApiError({
        status: 500,
        data: { message: 'Internal server error', statusCode: 500 },
      }),
    ).toEqual({
      status: 500,
      data: { message: 'Internal server error', statusCode: 500 },
      message: 'Internal server error',
    });
  });

  it('joins array Nest validation messages', () => {
    expect(
      extractApiError({
        status: 400,
        data: { message: ['name must be a string', 'email must be an email'] },
      }).message,
    ).toBe('name must be a string, email must be an email');
  });
});

describe('formatApiErrorMessage', () => {
  it('appends HTTP status to the default message', () => {
    expect(
      formatApiErrorMessage({ status: 503, data: null }, 'Unable to load employees'),
    ).toBe('Unable to load employees (HTTP 503).');
  });

  it('returns default message with period when status is missing', () => {
    expect(formatApiErrorMessage({}, 'Unable to load employees')).toBe(
      'Unable to load employees.',
    );
  });
});
