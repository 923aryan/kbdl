import { api } from '@/lib/api-client';
import type {
  ApproveShiftCompletionResponse,
  ApproveShiftResponse,
  CreateShiftPayload,
  CreateShiftResponse,
  GetEmployerShiftAnalyticsResponse,
  GetEmployerShiftsQuery,
  GetEmployerShiftsResponse,
  GetPendingShiftsQuery,
  GetPendingShiftsResponse,
  GetPublicUserProfileResponse,
  getReferredEmployeePayload,
  getReferredEmployeeResponse,
  GetShiftDetailsQuery,
  GetShiftDetailsResponse,
  RateShiftPayload,
  RateShiftResponse,
  RejectShiftResponse,
  ReportShiftNoShowResponse,
} from '@repo/types';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

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

export const useGetShiftDetails = (shiftId: string | null, query?: GetShiftDetailsQuery) => {
  return useQuery({
    queryKey: ['shift-details', shiftId, query],
    enabled: !!shiftId,
    queryFn: async () => {
      const queryString = query
        ? '?' +
          new URLSearchParams(
            Object.entries(query)
              .filter(
                ([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''),
              )
              .map(([k, v]) => [k, String(v)]),
          ).toString()
        : '';
      const response = await api.get<GetShiftDetailsResponse>(
        `/shift-swap/${shiftId}${queryString}`,
      );
      return response;
    },
  });
};

export const useGetEmployerShifts = (query?: GetEmployerShiftsQuery) => {
  return useQuery({
    queryKey: ['employer-shifts', query],
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

export const useGetEmployerShiftAnalytics = () => {
  return useQuery({
    queryKey: ['employer-shift-analytics'],
    queryFn: async () => {
      const response = await api.get<GetEmployerShiftAnalyticsResponse>(
        '/shift-swap/employer/analytics',
      );
      return response;
    },
  });
};

export const useGetPublicUserProfile = (
  userId?: string | null,
): UseQueryResult<GetPublicUserProfileResponse, Error> => {
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
      queryClient.invalidateQueries({ queryKey: ['employer-pending-shifts'] });
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
      queryClient.invalidateQueries({ queryKey: ['employer-pending-shifts'] });
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
      queryClient.invalidateQueries({ queryKey: ['employer-pending-shifts'] });
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

export const useGetPendingRequests = (query?: GetPendingShiftsQuery) => {
  return useQuery({
    queryKey: ['employer-pending-shifts', query],
    enabled: !!query,
    queryFn: async () => {
      const queryString = query
        ? '?' +
          new URLSearchParams(
            Object.entries(query)
              .filter(([_, v]) => v !== undefined && v !== null && v !== '')
              .map(([k, v]) => [k, String(v)]),
          ).toString()
        : '';
      const response = await api.get<GetPendingShiftsResponse>(
        `/shift-swap/employer/pending${queryString}`,
      );
      return response;
    },
  });
};
