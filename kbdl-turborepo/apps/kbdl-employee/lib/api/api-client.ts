import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message'; // React Native equivalent for sonner
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
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

// 1. Android emulators cannot resolve 'localhost'. They need '10.0.2.2'.
// For physical devices, you must use your machine's local IP (e.g., 192.168.1.X).
const FALLBACK_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://localhost:8000/api/v1';
const BASE_URL = apiUrl || FALLBACK_URL;

async function http<T>(path: string, config: RequestInit): Promise<ApiSuccess<T>> {
  const url = `${BASE_URL}${path}`;

  // 2. Mobile apps typically use Bearer tokens instead of strictly relying on cookies
  const accessToken = await SecureStore.getItemAsync('accessToken');

  const requestConfig: RequestInit = {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...config.headers,
    },
  };

  try {
    console.log('url was ', url);
    let response = await fetch(url, requestConfig);

    if (response.status === 401) {
      try {
        // Handle token refresh
        const refreshToken = await SecureStore.getItemAsync('refreshToken');

        const refreshResponse = await fetch(`${BASE_URL}/auth/token-refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          // If refresh fails, clear tokens so your Auth Director redirects to login
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          throw new Error('Refresh failed');
        }

        const newTokens = await refreshResponse.json();

        // Save new tokens
        await SecureStore.setItemAsync('accessToken', newTokens.accessToken);
        if (newTokens.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', newTokens.refreshToken);
        }

        // Retry the original request with the new token
        requestConfig.headers = {
          ...requestConfig.headers,
          Authorization: `Bearer ${newTokens.accessToken}`,
        };

        response = await fetch(url, requestConfig);
      } catch (error) {
        throw error;
      }
    }

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

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorResponse.error.message,
      });

      throw errorResponse;
    }

    if (response.status === 204) {
      if (config.method !== 'GET') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Operation successful' });
      }
      return {
        success: true,
        message: 'Operation successful',
        data: {} as T,
      };
    }

    const data = await response.json();
    const typedData = data as ApiSuccess<T>;

    if (config.method !== 'GET' && typedData.message) {
      Toast.show({ type: 'success', text1: 'Success', text2: typedData.message });
    }

    return typedData;
  } catch (error: any) {
    // 3. React Native throws a different error string for network failures
    if (error instanceof TypeError && error.message === 'Network request failed') {
      const msg = 'Network Error: Unable to connect to server';
      Toast.show({ type: 'error', text1: 'Network Error', text2: msg });
      throw { success: false, error: { code: 'NETWORK', message: msg } };
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string, config?: RequestInit) => http<T>(path, { method: 'GET', ...config }),

  post: <T>(path: string, body: any, config?: RequestInit) => {
    const fetchConfig: RequestInit = {
      method: 'POST',
      ...config,
    };

    if (body != null) {
      fetchConfig.body = JSON.stringify(body);
    }

    return http<T>(path, fetchConfig);
  },
  put: <T>(path: string, body: any, config?: RequestInit) =>
    http<T>(path, { method: 'PUT', body: JSON.stringify(body), ...config }),

  patch: <T>(path: string, body: any, config?: RequestInit) =>
    http<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...config }),

  delete: <T>(path: string, config?: RequestInit) => http<T>(path, { method: 'DELETE', ...config }),
};
