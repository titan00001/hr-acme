import React from 'react';

import {
  extractApiError,
  formatApiErrorMessage,
  type ExtractedApiError,
} from '@/infrastructure/api/extract-api-error';
import { ErrorAlert } from '@/presentation/components/feedback/error-alert';

export type ErrorPresentationProps = {
  message: string;
  extracted: ExtractedApiError;
};

function DefaultErrorPresentation({
  message,
}: ErrorPresentationProps): React.ReactElement {
  return <ErrorAlert message={message} />;
}

export type ErrorHandlerProps = {
  error: unknown;
  /** Fallback copy when the API does not provide a usable message. */
  defaultMessage: string;
  /**
   * Custom presentation (card, toast shell, inline text, …).
   * Receives the resolved message + extracted error metadata.
   * Defaults to {@link ErrorAlert}.
   */
  presentation?: React.ComponentType<ErrorPresentationProps>;
  /**
   * Render-prop alternative to `presentation` for arbitrary nodes.
   * Wins over `presentation` when both are provided.
   */
  children?: (props: ErrorPresentationProps) => React.ReactNode;
};

/**
 * Surfaces an API/RTK error with a consistent message and pluggable UI.
 *
 * @example Default card
 * ```tsx
 * {isError ? (
 *   <ErrorHandler error={error} defaultMessage="Unable to load employees" />
 * ) : null}
 * ```
 *
 * @example Custom toast-like node
 * ```tsx
 * <ErrorHandler error={error} defaultMessage="Save failed">
 *   {({ message }) => <div className="toast">{message}</div>}
 * </ErrorHandler>
 * ```
 */
export function ErrorHandler({
  error,
  defaultMessage,
  presentation: Presentation = DefaultErrorPresentation,
  children,
}: ErrorHandlerProps): React.ReactElement | null {
  if (error === undefined || error === null) {
    return null;
  }

  const extracted = extractApiError(error);
  const message = formatApiErrorMessage(error, defaultMessage);
  const props: ErrorPresentationProps = { message, extracted };

  if (children) {
    return <>{children(props)}</>;
  }

  return <Presentation {...props} />;
}
