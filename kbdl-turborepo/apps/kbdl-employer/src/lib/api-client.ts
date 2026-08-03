// lib/api-client.ts
// Set API host via env (apps/kbdl-employer/.env.local or .env.development):
//   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
//   NEXT_PUBLIC_API_URL=http://20.197.60.119:8000/api/v1
// Restart next dev after changing NEXT_PUBLIC_* values.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
  console.log('API CLIENT FILE LOADED');
  console.log('PATH:', path);
  console.log('FINAL URL:', url);
  console.trace();

  const requestConfig: RequestInit = {
    credentials: 'include', // IMPORTANT: send cookies
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
  };

  try {
    const response = await fetch(url, requestConfig);

    // HTTP ERROR
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
      (customError as any).raw = errorResponse;

      throw customError;
    }

    // NO CONTENT
    if (response.status === 204) {
      return {
        success: true,
        message: 'Operation successful',
        data: {} as T,
      };
    }

    // SUCCESS
    const data = await response.json();

    return data as ApiSuccess<T>;
  } catch (error: any) {
    // NETWORK ERROR
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
};
