// lib/api-client.ts
// Frontend-only env: apps/kbdl-employer/.env
// Backend secrets: kbdl-turborepo/.env
// Restart next dev after changing NEXT_PUBLIC_* values.

import { getAccessToken } from './auth-tokens';

// const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
// const BASE_URL = 'http://localhost:8000/api/v1';
const BASE_URL = 'http://51.20.0.36:8000/api/v1';

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

async function http<T>(path: string, config: RequestInit = {}): Promise<ApiSuccess<T>> {
  const url = `${BASE_URL}${path}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config.headers as Record<string, string> | undefined),
  };

  // Cookies work for same-site (localhost → localhost).
  // Bearer works for cross-origin (localhost → remote API IP).
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestConfig: RequestInit = {
    credentials: 'include',
    ...config,
    headers,
  };

  try {
    const response = await fetch(url, requestConfig);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));

      const errorResponse: ApiError = {
        success: false,
        error: {
          code: errorBody.error?.code || 'HTTP_ERROR',
          message: errorBody.error?.message || response.statusText || 'Something went wrong',
          details: errorBody.error?.details || errorBody,
        },
      };

      const customError = new Error(errorResponse.error.message);
      (customError as any).code = errorResponse.error.code;
      (customError as any).details = errorResponse.error.details;
      throw customError;
    }

    if (response.status === 204) {
      return {
        success: true,
        message: 'Operation successful',
        data: {} as T,
      };
    }

    return (await response.json()) as ApiSuccess<T>;
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network Error: Unable to connect to server');
      (networkError as any).code = 'NETWORK';
      throw networkError;
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string, config?: RequestInit) =>
    http<T>(path, {
      method: 'GET',
      ...config,
    }),

  post: <T>(path: string, body?: unknown, config?: RequestInit) => {
    const fetchConfig: RequestInit = {
      method: 'POST',
      ...config,
    };

    if (body != null) {
      fetchConfig.body = JSON.stringify(body);
    }

    return http<T>(path, fetchConfig);
  },

  put: <T>(path: string, body?: unknown, config?: RequestInit) =>
    http<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...config,
    }),

  patch: <T>(path: string, body?: unknown, config?: RequestInit) =>
    http<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...config,
    }),

  delete: <T>(path: string, config?: RequestInit) =>
    http<T>(path, {
      method: 'DELETE',
      ...config,
    }),

  /** Multipart upload — do not set Content-Type; browser adds boundary */
  upload: async <T>(path: string, formData: FormData): Promise<ApiSuccess<T>> => {
    const url = `${BASE_URL}${path}`;
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const customError = new Error(
        errorBody.error?.message || response.statusText || 'Upload failed',
      );
      (customError as { code?: string }).code = errorBody.error?.code;
      throw customError;
    }

    return (await response.json()) as ApiSuccess<T>;
  },
};
