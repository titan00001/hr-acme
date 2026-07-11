import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ErrorHandler } from './error-handler';
import type { ErrorPresentationProps } from './error-handler';

function ToastPresentation({ message }: ErrorPresentationProps): React.ReactElement {
  return <div data-testid="toast">{message}</div>;
}

describe('ErrorHandler', () => {
  it('renders nothing when error is absent', () => {
    const { container } = render(
      <ErrorHandler error={null} defaultMessage="Unable to load employees" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the default alert card with HTTP status', () => {
    render(
      <ErrorHandler
        error={{ status: 503, data: null }}
        defaultMessage="Unable to load employees"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load employees (HTTP 503).',
    );
  });

  it('supports a custom presentation component', () => {
    render(
      <ErrorHandler
        error={{ status: 400, data: null }}
        defaultMessage="Save failed"
        presentation={ToastPresentation}
      />,
    );

    expect(screen.getByTestId('toast')).toHaveTextContent(
      'Save failed (HTTP 400).',
    );
  });

  it('supports a render-prop child for arbitrary nodes', () => {
    render(
      <ErrorHandler error={{ status: 401 }} defaultMessage="Sign-in failed">
        {({ message }) => <p data-testid="inline">{message}</p>}
      </ErrorHandler>,
    );

    expect(screen.getByTestId('inline')).toHaveTextContent(
      'Sign-in failed (HTTP 401).',
    );
  });
});
