import type {
  CreateShiftPayload,
  CreateShiftResponse,
  ApproveShiftCompletionResponse,
  ApproveShiftResponse,
  GetEmployerShiftsResponse,
  GetPendingShiftsResponse,
  GetPublicUserProfileResponse,
  RateShiftPayload,
  RateShiftResponse,
  RejectShiftResponse,
  ReportShiftNoShowResponse,
  getReferredEmployeePayload,
  getReferredEmployeeResponse,
} from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

type EmployerShiftWithPending = GetEmployerShiftsResponse[number] & {
  pendingApplications: GetPendingShiftsResponse;
};

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
      const [shiftsResponse, pendingResponse] = await Promise.all([
        api.get<GetEmployerShiftsResponse>('/shift-swap/employer?limit=100'),
        api.get<GetPendingShiftsResponse>('/shift-swap/employer/pending?limit=100'),
      ]);

      const pendingByShiftId = pendingResponse.data.reduce(
        (acc, application) => {
          const typedApplication = application as unknown as {
            type?: string;
            shift_id?: string;
            shift?: {
              id?: string;
              created_by?: string;
              replacement_employee_id?: string | null;
              request_accepted?: boolean;
            };
          };
          const isWorkerPrivateInvite =
            typedApplication.type === 'invited' &&
            typedApplication.shift?.created_by === 'user' &&
            Boolean(typedApplication.shift?.replacement_employee_id);

          if (isWorkerPrivateInvite && !typedApplication.shift?.request_accepted) {
            return acc;
          }

          const shiftId = typedApplication.shift_id || typedApplication.shift?.id;
          if (!shiftId) return acc;

          acc[shiftId] = [...(acc[shiftId] || []), application];
          return acc;
        },
        {} as Record<string, GetPendingShiftsResponse>,
      );

      return shiftsResponse.data.map((shift) => ({
        ...shift,
        pendingApplications: pendingByShiftId[shift.id] || [],
      })) as EmployerShiftWithPending[];
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
    mutationFn: async (shiftApplicationId: string) => {
      const response = await api.patch<ApproveShiftResponse>(
        `/shift-swap/${shiftApplicationId}/approve`,
      );
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
    mutationFn: async (shiftApplicationId: string) => {
      const response = await api.post<RejectShiftResponse>('/shift-swap/reject', {
        shift_application_id: shiftApplicationId,
      });
      return response.data;
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
