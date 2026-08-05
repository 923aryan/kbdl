import { api } from '@/lib/api-client';

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
