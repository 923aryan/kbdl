import { api } from '@/lib/api/api-client';
import { User } from '@repo/db/shared';
import type {
  AppUser,
  UserRegisterPayload,
  UserSendOTPRequest,
  UserVerifyOTPPayload,
  UserVerifyOTPResponse,
  UserVerifyRegisterPayload,
} from '@repo/types';
import { useMutation, useQuery } from '@tanstack/react-query';
export const useRegisterUser = () => {
  return useMutation({
    mutationFn: async (credentials: UserRegisterPayload) => {
      const response = await api.post<null>('/auth/register/user', credentials);
      return response.data;
    },
  });
};

export const useVerifyRegisterUser = () => {
  return useMutation({
    mutationFn: async (credentials: UserVerifyRegisterPayload) => {
      const response = await api.post<{ user: User; accessToken: string; refreshToken: string }>
        ('/auth/register/user/verify', credentials);
      return response.data; // { user, accessToken, refreshToken }
    },
  });
};

/**
 * 3. Request Login (Sends OTP to existing user)
 */
export const useSendUserOTP = () => {
  return useMutation({
    mutationFn: async (credentials: UserSendOTPRequest) => {
      // Backend returns null data for this endpoint
      const response = await api.post<null>('/auth/user/send-otp', credentials);
      return response.data;
    },
  });
};

/**
 * 4. Verify Login (Validates OTP and logs user in)
 */
export const useVerifyUserOTP = () => {
  return useMutation({
    mutationFn: async (credentials: UserVerifyOTPPayload) => {
      const response = await api.post<UserVerifyOTPResponse>('/auth/user/verify-otp', credentials);
      return response.data; // { user, accessToken, refreshToken }
    },
  });
};
/**
 * 5. Verify Login (Validates OTP and logs user in)
 */

//Plain function for zustand
export const getMe = async () => {
  const response = await api.get<AppUser>('/profile/users/me');
  return response.data;
};

export const useGetMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });
};
