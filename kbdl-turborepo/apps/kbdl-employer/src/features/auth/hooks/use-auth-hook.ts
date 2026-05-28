import type {
  EmployerRegisterPayload,
  EmployerVerifyOTPResponse,
  EmployerVerifyRegisterPayload,
  GetCurrentEmployerProfileResponse,
  LogoutResponse
} from '@repo/types';
import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import { EmployerVerifyRegisterResponse } from '../types/employer';

// 1. Register Employer
export const useRegisterEmployer = () => {
  return useMutation({
    mutationFn: async (payload: EmployerRegisterPayload) => {
      const response = await api.post<null>('/auth/register/employer', payload);
      return response.data;
    },
  });
};

// 2. Verify Registered Employer
export const useVerifyRegisteredEmployer = () => {
  return useMutation({
    mutationFn: async (payload: EmployerVerifyRegisterPayload) => {
      const response = await api.post<EmployerVerifyRegisterResponse>(
        '/auth/register/employer/verify',
        payload,
      );
      return response.data;
    },
  });
};

// 3. Send Employer OTP
export const useSendEmployerOtp = () => {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const response = await api.post<null>('/auth/employer/send-otp', payload);
      return response.data;
    },
  });
};

// 4. Verify Employer OTP
export const useVerifyEmployerOtp = () => {
  return useMutation({
    mutationFn: async (payload: { email: string; otp: string }) => {
      const response = await api.post<EmployerVerifyOTPResponse>('/auth/employer/verify-otp', payload);
      return response.data;
    },
  });
};

// 5. Logout
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<LogoutResponse>('/auth/logout');
      return response.data;
    },
  });
};


// 6. Get Employer Profile
export const useGetEmployerProfile = (): UseQueryResult<GetCurrentEmployerProfileResponse, Error> => {
  return useQuery({
    queryKey: ['employer-profile'],
    queryFn: async () => {
      const response = await api.get<GetCurrentEmployerProfileResponse>('/profile/employers/me');
      return response.data
    },
  });
};
