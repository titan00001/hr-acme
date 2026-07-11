export type ExtractedApiError = {
  status?: number;
  data?: unknown;
  /** NestJS often returns `{ message: string | string[] }` */
  message?: string;
};

function readNestMessage(data: unknown): string | undefined {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (typeof data !== 'object' || data === null || !('message' in data)) {
    return undefined;
  }

  const raw = (data as { message?: unknown }).message;

  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }

  if (Array.isArray(raw)) {
    const parts = raw.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  return undefined;
}

/**
 * Normalize RTK Query / axiosBaseQuery errors into a stable shape.
 */
export function extractApiError(error: unknown): ExtractedApiError {
  if (typeof error !== 'object' || error === null) {
    return {};
  }

  const record = error as {
    status?: unknown;
    data?: unknown;
    message?: unknown;
  };

  const status =
    typeof record.status === 'number' ? record.status : undefined;
  const data = 'data' in record ? record.data : undefined;
  const fromNest = readNestMessage(data);
  const fromTopLevel =
    typeof record.message === 'string' && record.message.trim()
      ? record.message
      : undefined;

  return {
    status,
    data,
    message: fromNest ?? fromTopLevel,
  };
}

/**
 * Build a user-facing string: default message + optional HTTP status.
 */
export function formatApiErrorMessage(
  error: unknown,
  defaultMessage: string,
): string {
  const extracted = extractApiError(error);
  const base = defaultMessage.replace(/\.\s*$/, '');

  if (extracted.status !== undefined) {
    return `${base} (HTTP ${extracted.status}).`;
  }

  return `${base}.`;
}
