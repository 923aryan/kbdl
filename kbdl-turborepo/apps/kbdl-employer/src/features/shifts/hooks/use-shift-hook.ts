import type {
  CreateShiftPayload,
  CreateShiftResponse,
  EmployerShiftActionResponse,
  GetEmployerShiftsResponse,
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

export const useApproveShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const response = await api.post<EmployerShiftActionResponse>('/shift-swap/approve', {
        shift_id: shiftId,
      });
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
      const response = await api.post<EmployerShiftActionResponse>('/shift-swap/reject', {
        shift_id: shiftId,
      });
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
