import { api } from '@/lib/api/api-client';
import type { EmployeePunchAttendanceBody, EmployeePunchContext, EmployeePunchResult } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useEmployeeAttendanceContext = (employmentId?: string) => {
  return useQuery({
    queryKey: ['employee-attendance-context', employmentId ?? 'auto'],
    queryFn: async () => {
      const query = employmentId ? `?employment_id=${employmentId}` : '';
      const response = await api.get<EmployeePunchContext>(
        `/operations/employee/attendance/context${query}`,
      );
      return response.data;
    },
  });
};

export const useEmployeePunchAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EmployeePunchAttendanceBody) => {
      const response = await api.post<EmployeePunchResult>(
        '/operations/employee/attendance/punch',
        payload,
        { showToast: true },
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['employee-attendance-context', data.selected?.employment_id ?? 'auto'],
        data,
      );
      queryClient.invalidateQueries({ queryKey: ['employee-attendance-context'] });
    },
  });
};
