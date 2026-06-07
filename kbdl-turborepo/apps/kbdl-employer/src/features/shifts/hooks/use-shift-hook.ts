import type {
  CreateShiftPayload,
  CreateShiftResponse,
  ApproveShiftCompletionResponse,
  ApproveShiftResponse,
  GetEmployerShiftsResponse,
  GetPublicUserProfileResponse,
  RateShiftPayload,
  RateShiftResponse,
  ReportShiftNoShowResponse,
  getReferredEmployeePayload,
  getReferredEmployeeResponse,
} from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const useCreateShiftSwap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateShiftPayload) => {
      const response = await api.post<CreateShiftResponse>('/shift-swap', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-shifts'] });
    },
  });
};

export const useGetEmployerShifts = () => {
  return useQuery({
    queryKey: ['employer-shifts'],
    queryFn: async () => {
      const response = await api.get<GetEmployerShiftsResponse>('/shift-swap/employer');
      // console.log('SHIFT API:', response);
      return response.data;
    },
  });
};

export const useGetPublicUserProfile = (userId?: string | null) => {
  return useQuery({
    queryKey: ['public-user-profile', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await api.get<GetPublicUserProfileResponse>(`/profile/users/${userId}`);
      return response.data;
    },
  });
};

export const useApproveShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const response = await api.patch<ApproveShiftResponse>(`/shift-swap/${shiftId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-shifts'] });
    },
  });
};

export const useRejectShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      void shiftId;
      throw new Error(
        'Rejecting shift requests is not available in the current backend API. Please add a reject endpoint to reopen the shift.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-shifts'] });
    },
  });
};

export const useCompleteShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const response = await api.patch<ApproveShiftCompletionResponse>(
        `/shift-swap/${shiftId}/complete`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-shifts'] });
    },
  });
};

export const useReportShiftNoShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const response = await api.patch<ReportShiftNoShowResponse>(`/shift-swap/${shiftId}/no-show`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-shifts'] });
    },
  });
};

export const useRateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RateShiftPayload) => {
      const response = await api.post<RateShiftResponse>('/shift-swap/rate', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-shifts'] });
    },
  });
};

export const useGetReferredEmployee = () => {
  return useMutation({
    mutationFn: async (payload: getReferredEmployeePayload) => {
      const response = await api.post<getReferredEmployeeResponse>(
        '/shift-swap/referred-employee',
        payload,
      );
      return response.data;
    },
  });
};
