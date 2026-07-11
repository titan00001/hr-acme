import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  LEFT_EMPLOYEES_NOTICE,
  LeftEmployeesNotice,
} from './left-employees-notice';

describe('LeftEmployeesNotice', () => {
  it('renders the dashboard exclusion notice', () => {
    render(<LeftEmployeesNotice />);

    expect(screen.getByRole('note')).toHaveTextContent(LEFT_EMPLOYEES_NOTICE);
  });
});
