import { getAccessToken } from './auth-tokens';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
console.log('BASE_URL,,,,,,,,,,,,,,,,,,,,,,,,,', BASE_URL);
export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

async function http<T>(path: string, config: RequestInit = {}): Promise<ApiSuccess<T>> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...config,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || response.statusText || 'Request failed');
  }

  return (await response.json()) as ApiSuccess<T>;
}

export const api = {
  get: <T>(path: string) => http<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    http<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    http<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};
