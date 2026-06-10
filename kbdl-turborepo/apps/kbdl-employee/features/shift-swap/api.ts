import { api } from '@/lib/api/api-client';
import type {
  AcceptShiftPayload,
  AcceptShiftResponse,
  ApplyForPublicShiftPayload,
  ApplyForPublicShiftResponse,
  CancelShiftPayload,
  CancelShiftResponse,
  CreateShiftPayload,
  CreateShiftResponse,
  GetBestShiftMatchesResponse,
  GetCreatedShiftsForEmployeeResponse,
  GetEmployeeShiftsResponse,
  GetExtraShiftsResponse,
  GetLatestShiftsResponse,
  getReferredEmployeePayload,
  getReferredEmployeeResponse,
  GetShiftDetailsResponse,
  SyncSavedShiftsPayload,
  SyncSavedShiftsResponse,
  UpdateShiftPayload,
  UpdateShiftResponse,
  WithdrawShiftApplicationPayload,
  WithdrawShiftApplicationResponse,
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

export const useSyncSavedShifts = () => {
  return useMutation({
    mutationFn: async (payload: SyncSavedShiftsPayload) => {
      const response = await api.post<SyncSavedShiftsResponse>('/shift-swap/sync-saved', payload);
      return response.data;
    },
  });
};

export const useGetShiftDetails = (shiftId: string) => {
  return useQuery({
    queryKey: ['shift-details', shiftId],
    queryFn: async () => {
      const response = await api.get<GetShiftDetailsResponse>(`/shift-swap/${shiftId}`);
      return response.data;
    },
    enabled: !!shiftId,
  });
};

// A. Accept Shift Swap(only if this user has been requested this shfits specifically)
export const useAcceptShiftSwap = () => {
  return useMutation({
    mutationFn: async (payload: AcceptShiftPayload) => {
      const response = await api.post<AcceptShiftResponse>('/shift-swap/accept', payload);
      return response;
    },
  });
};

// B. Apply for public shifts
export const useApplyForPublicShift = () => {
  return useMutation({
    mutationFn: async (payload: ApplyForPublicShiftPayload) => {
      const response = await api.post<ApplyForPublicShiftResponse>('/shift-swap/apply', payload);
      return response;
    },
  });
};

export const useGetEmployeeShifts = () => {
  return useQuery({
    queryKey: ['employee-shifts'],
    queryFn: async () => {
      const response = await api.get<GetEmployeeShiftsResponse>('/shift-swap/employee');
      return response.data;
    },
  });
};

export const useGetCreatedShiftsForEmployee = () => {
  return useQuery({
    queryKey: ['employee-created-shifts'],
    queryFn: async () => {
      const response = await api.get<GetCreatedShiftsForEmployeeResponse>(
        '/shift-swap/employee/created',
      );
      return response.data;
    },
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

export const useGetExtraShifts = (query?: string) => {
  console.log('extra shift query: ', query);

  return useQuery({
    queryKey: ['extra-shifts', query],

    queryFn: async () => {
      const response = await api.get<GetExtraShiftsResponse>(`/shift-swap/extra?${query}`);

      return response.data;
    },
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
export const useGetLatestShifts = (query?: string) => {
  return useQuery({
    queryKey: ['employee-latest-shifts'],

    queryFn: async () => {
      const response = await api.get<GetLatestShiftsResponse>(`/shift-swap/latest?${query}`);

      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
export const useGetBestMatchesShifts = (query?: string) => {
  return useQuery({
    queryKey: ['employee-best-matches-shifts'],

    queryFn: async () => {
      const response = await api.get<GetBestShiftMatchesResponse>(
        `/shift-swap/best-matches?${query}`,
      );

      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
export const useWithdrawShiftApplication = () => {
  return useMutation({
    mutationFn: async (payload: WithdrawShiftApplicationPayload) => {
      const response = await api.post<WithdrawShiftApplicationResponse>(
        '/shift-swap/withdraw',
        payload,
      );
      return response.data;
    },
  });
};
