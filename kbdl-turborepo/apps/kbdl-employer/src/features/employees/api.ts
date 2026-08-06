import { api } from '@/lib/api-client';
import type { EmployerEmployeeFacets, EmployerEmployeeListItem } from '@repo/types';

export type MetaDepartment = {
  id: string;
  name: string;
  description: string | null;
};

export type MetaDesignation = {
  id: string;
  name: string;
  description: string | null;
};

export type MetaSupervisor = {
  id: string;
  user_id: string;
  name: string | null;
  phone_no: string;
  role_code: string;
  role_name: string;
  department_id: string | null;
  department_name: string | null;
};

export type MetaWorkShift = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  is_active: boolean;
};

type MetaListParams = {
  search?: string;
  page?: number;
  limit?: number;
};

const toQuery = (params: MetaListParams) => {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

export async function fetchDepartmentsMeta(params: MetaListParams = {}) {
  return api.get<MetaDepartment[]>(`/operations/employer/meta/departments${toQuery(params)}`);
}

export async function fetchDesignationsMeta(params: MetaListParams = {}) {
  return api.get<MetaDesignation[]>(`/operations/employer/meta/designations${toQuery(params)}`);
}

export async function fetchSupervisorsMeta(params: MetaListParams = {}) {
  return api.get<MetaSupervisor[]>(`/operations/employer/meta/supervisors${toQuery(params)}`);
}

export async function fetchWorkShiftsMeta(params: MetaListParams = {}) {
  return api.get<MetaWorkShift[]>(`/operations/employer/meta/work-shifts${toQuery(params)}`);
}

/** Initial onboard dropdown data — parallel fetch */
export async function fetchOnboardMetaInitial(limit = 30) {
  const [departments, designations, supervisors, workShifts] = await Promise.all([
    fetchDepartmentsMeta({ limit }),
    fetchDesignationsMeta({ limit }),
    fetchSupervisorsMeta({ limit }),
    fetchWorkShiftsMeta({ limit }),
  ]);

  return {
    departments: departments.data,
    designations: designations.data,
    supervisors: supervisors.data,
    workShifts: workShifts.data,
  };
}

export type EmployeesListParams = {
  search?: string;
  designation?: string[];
  department?: string[];
  status?: string[];
  gender?: string[];
  employee_type?: string[];
  sort?: 'name' | 'joined_at' | 'designation' | 'status' | 'rating';
  sort_dir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type EmployeesListResult = {
  data: EmployerEmployeeListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    facets: EmployerEmployeeFacets;
  };
};

const appendCsv = (query: URLSearchParams, key: string, values?: string[]) => {
  if (values?.length) query.set(key, values.join(','));
};

export async function fetchEmployeesList(
  params: EmployeesListParams = {},
): Promise<EmployeesListResult> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set('search', params.search.trim());
  appendCsv(query, 'designation', params.designation);
  appendCsv(query, 'department', params.department);
  appendCsv(query, 'status', params.status);
  appendCsv(query, 'gender', params.gender);
  appendCsv(query, 'employee_type', params.employee_type);
  if (params.sort) query.set('sort', params.sort);
  if (params.sort_dir) query.set('sort_dir', params.sort_dir);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const response = await api.get<EmployerEmployeeListItem[]>(
    `/operations/employer/employees${qs ? `?${qs}` : ''}`,
  );

  const meta = response.meta as EmployeesListResult['meta'] | undefined;

  return {
    data: response.data,
    meta: {
      page: Number(meta?.page ?? params.page ?? 1),
      limit: Number(meta?.limit ?? params.limit ?? 10),
      total: Number(meta?.total ?? 0),
      totalPages: Number(meta?.totalPages ?? 1),
      facets: meta?.facets ?? {
        designation: {},
        status: {},
        gender: {},
        department: {},
        employee_type: {},
      },
    },
  };
}
