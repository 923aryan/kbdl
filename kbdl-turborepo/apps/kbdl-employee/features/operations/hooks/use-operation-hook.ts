import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// Note: Adjust the import path for your `api` client depending on the location of your hook
import { api } from '@/lib/api/api-client';
import type {
  GetAllEmployeeEmploymentResponse,
  GetEmployeeEmploymentResponse,
  GetEmployeePendingEmploymentResponse,
} from '@repo/types';

// Retrieves all EmployeeEmployment models tied to the logged-in user (employee)
export const useGetAllEmployeeEmployment = () => {
  return useQuery({
    queryKey: ['all-employee-employments'],
    queryFn: async () => {
      const response = await api.get<GetAllEmployeeEmploymentResponse>('/operations/employee');
      return response.data;
    },
  });
};

export const useAcceptEmployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<GetEmployeeEmploymentResponse>(
        `/operations/employee/${id}/accept`,
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-pending-employments'] });
      queryClient.invalidateQueries({ queryKey: ['all-employee-employments'] });
    },
  });
};

export const useDeclineEmployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/operations/employee/${id}/decline`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-pending-employments'] });
    },
  });
};

// Retrieves a specific EmployeeEmployment model tied to the logged-in user (employee)
export const useGetEmployeeEmployment = (id: string) => {
  return useQuery({
    queryKey: ['employee-employment', id],
    queryFn: async () => {
      const response = await api.get<GetEmployeeEmploymentResponse>(`/operations/employee/${id}`);
      return response.data;
    },
  });
};

export const useGetPendingEmployments = () => {
  return useQuery({
    queryKey: ['employee-pending-employments'],
    queryFn: async () => {
      const response = await api.get<GetEmployeePendingEmploymentResponse>(
        `/operations/employee/pending`,
      );
      return response.data;
    },
  });
};
