import { api } from '@/lib/api-client';
import type { EmployeeLeaveOverview } from '@repo/types';

export type { EmployeeLeaveOverview };

export async function fetchEmployeeLeave(
  employmentId: string,
  range?: { from?: string; to?: string },
) {
  const query = new URLSearchParams();
  if (range?.from) query.set('from', range.from);
  if (range?.to) query.set('to', range.to);
  const qs = query.toString();
  const response = await api.get<EmployeeLeaveOverview>(
    `/operations/employer/leave/employee/${employmentId}${qs ? `?${qs}` : ''}`,
  );
  return response.data;
}

export async function createEmployeeLeave(
  employmentId: string,
  payload: {
    leave_type_id?: string;
    leave_type?: string;
    from: string;
    to: string;
    reason: string;
    apply_as?: 'hr' | 'manager';
  },
) {
  const response = await api.post<EmployeeLeaveOverview>(
    `/operations/employer/leave/employee/${employmentId}`,
    payload,
  );
  return response.data;
}

export async function updateLeaveRequest(requestId: string, status: 'approved' | 'rejected') {
  const response = await api.patch<EmployeeLeaveOverview>(`/operations/employer/leave/${requestId}`, {
    status,
  });
  return response.data;
}
