import { api } from '@/lib/api-client';
import type {
  CompanyLeaveCatalog,
  CompanyLeaveRequestView,
  EmployeeLeaveOverview,
} from '@repo/types';

export type { CompanyLeaveCatalog, CompanyLeaveRequestView, EmployeeLeaveOverview };

export async function fetchCompanyLeaveCatalog(includeInactive = false) {
  const qs = includeInactive ? '?include_inactive=true' : '';
  const response = await api.get<CompanyLeaveCatalog>(`/operations/employer/leave/types${qs}`);
  return response.data;
}

export async function createCompanyLeaveType(payload: {
  name: string;
  days_per_year: number;
  is_paid?: boolean;
  sort_order?: number;
}) {
  const response = await api.post<CompanyLeaveCatalog>('/operations/employer/leave/types', payload);
  return response.data;
}

export async function updateCompanyLeaveType(
  typeId: string,
  payload: {
    name?: string;
    days_per_year?: number;
    is_paid?: boolean;
    is_active?: boolean;
    sort_order?: number;
  },
) {
  const response = await api.patch<CompanyLeaveCatalog>(
    `/operations/employer/leave/types/${typeId}`,
    payload,
  );
  return response.data;
}

export async function updateCompanyLeavePolicy(payload: {
  accrue_per_month?: number;
  annual_quota?: number;
  max_carry_forward?: number;
  carry_forward_at_year_end?: boolean;
  encash_excess?: boolean;
  lines?: string[];
}) {
  const response = await api.put<CompanyLeaveCatalog>('/operations/employer/leave/policy', payload);
  return response.data;
}

export type CompanyLeaveRequestsResult = {
  data: CompanyLeaveRequestView[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export async function fetchCompanyLeaveRequests(params: {
  search?: string;
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
} = {}): Promise<CompanyLeaveRequestsResult> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.status) query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const response = await api.get<CompanyLeaveRequestView[]>(
    `/operations/employer/leave/requests${qs ? `?${qs}` : ''}`,
  );
  const meta = response.meta as CompanyLeaveRequestsResult['meta'] | undefined;
  return {
    data: response.data,
    meta: {
      page: Number(meta?.page ?? params.page ?? 1),
      limit: Number(meta?.limit ?? params.limit ?? 10),
      total: Number(meta?.total ?? 0),
      totalPages: Number(meta?.totalPages ?? 1),
    },
  };
}
