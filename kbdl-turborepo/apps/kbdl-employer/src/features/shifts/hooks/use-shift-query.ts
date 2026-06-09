'use client';

import { CreateShiftPayload, CreateShiftResponse, Shift } from '@repo/types';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { cancelShift, createShift, getEmployerShifts, updateShift } from '../api';

/**
 * Hook to fetch all shifts created by the employer
 */
export const useGetEmployerShifts = (): UseQueryResult<Shift[], Error> => {
  return useQuery({
    queryKey: ['employer-shifts'],
    queryFn: async () => {
      return await getEmployerShifts();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });
};

/**
 * Hook to create a new shift
 */
export const useCreateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateShiftPayload) => {
      return await createShift(payload);
    },
    onSuccess: () => {
      // Invalidate and refetch shifts
      queryClient.invalidateQueries({ queryKey: ['employer-shifts'] });
    },
  });
};

/**
 * Hook to update an existing shift
 */
export const useUpdateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { shift_id: string; [key: string]: unknown }) => {
      return await updateShift(payload);
    },
    onSuccess: () => {
      // Invalidate and refetch shifts
      queryClient.invalidateQueries({ queryKey: ['employer-shifts'] });
    },
  });
};

/**
 * Hook to cancel a shift
 */
export const useCancelShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shift_id: string) => {
      return await cancelShift({ shift_id });
    },
    onSuccess: () => {
      // Invalidate and refetch shifts
      queryClient.invalidateQueries({ queryKey: ['employer-shifts'] });
    },
  });
};
