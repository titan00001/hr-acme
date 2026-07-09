import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('renders the application title', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /acme hr salary management/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/frontend scaffold ready/i)).toBeInTheDocument();
  });
});
