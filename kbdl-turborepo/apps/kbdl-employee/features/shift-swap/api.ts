import { api } from '@/lib/api/api-client';
import type {
  AcceptShiftPayload,
  AcceptShiftResponse,
  CancelShiftPayload,
  CancelShiftResponse,
  CreateShiftPayload,
  CreateShiftResponse,
  GetEmployeeShiftsResponse,
  GetExtraShiftsQuery,
  GetExtraShiftsResponse,
  UpdateShiftPayload,
  UpdateShiftResponse,
  getReferredEmployeePayload,
  getReferredEmployeeResponse,
} from '@repo/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { OpenShift } from './types/shift-swap-types';

// A. Create Shift Swap
export const useCreateShiftSwap = () => {
  return useMutation({
    mutationFn: async (payload: CreateShiftPayload) => {
      const response = await api.post<CreateShiftResponse>('/shift-swap', payload);
      return response.data;
    },
  });
};

// A. Accept Shift Swap
export const useAcceptShiftSwap = () => {
  return useMutation({
    mutationFn: async (payload: AcceptShiftPayload) => {
      const response = await api.post<AcceptShiftResponse>('/shift-swap/accept', payload);
      return response.data;
    },
  });
};

// B1. See Accepted Shifts (Worker)
export const getEmployeeShifts = async () => {
  const response = await api.get<GetEmployeeShiftsResponse>('/shift-swap/employee');
  return response.data;
};

export const useGetEmployeeShifts = () => {
  return useQuery({
    queryKey: ['employee-shifts'],
    queryFn: getEmployeeShifts,
  });
};

// B3. Cancel Shift (Both User Types)
export const useCancelShift = () => {
  return useMutation({
    mutationFn: async (payload: CancelShiftPayload) => {
      const response = await api.post<CancelShiftResponse>('/shift-swap/cancel', payload);
      return response.data;
    },
  });
};

// B4. Update Shift (Only before acceptance)
export const useUpdateShift = () => {
  return useMutation({
    mutationFn: async (payload: UpdateShiftPayload) => {
      const response = await api.patch<UpdateShiftResponse>('/shift-swap', payload);
      return response.data;
    },
  });
};

// C. Get Extra Shifts (Public matching)
export const getExtraShifts = async (query?: GetExtraShiftsQuery) => {
  const response = await api.get<GetExtraShiftsResponse>('/shift-swap/extra', { params: query });
  return response.data;
};

export const useGetExtraShifts = (query?: GetExtraShiftsQuery) => {
  return useQuery({
    queryKey: ['extra-shifts', query],
    queryFn: () => getExtraShifts(query),
  });
};

// E.Others: Get Referred Employee ID
export const useGetReferredEmployee = () => {
  return useMutation({
    mutationFn: async (payload: getReferredEmployeePayload) => {
      const response = await api.post<getReferredEmployeeResponse>(
        '/shift-swap/referred-employee',
        payload,
      );
      return response;
    },
  });
};

//F.Get shift after notified by socket provider
export const useGetOpenShifts = () => {
  return useQuery({
    queryKey: ['employee-open-shifts'],

    queryFn: async () => {
      const response = await api.get<OpenShift[]>('/shift-swap/employee/open');

      return response.data;
    },
  });
};
