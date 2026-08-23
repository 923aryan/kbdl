import { api } from '@/lib/api-client';
import type {
  EmployeeEmploymentDTO,
  EmployerEmployeeFacets,
  EmployerEmployeeListItem,
  UpdateEmployeeProfilePayload,
} from '@repo/types';

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

export type MetaBranch = {
  id: string;
  name: string;
  has_location: boolean;
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

export async function fetchBranchesMeta(params: MetaListParams = {}) {
  const catalog = await api.get<import('@repo/types').CompanyCatalogView>('/operations/employer/catalog');
  const q = params.search?.trim().toLowerCase();
  const rows = q
    ? catalog.data.branches.filter((row) => row.name.toLowerCase().includes(q))
    : catalog.data.branches;
  return { ...catalog, data: rows };
}

export async function fetchNextEmployeeNumber() {
  return api.get<{ employee_no: string }>('/operations/employer/meta/next-employee-no');
}

/** Initial onboard dropdown data — parallel fetch */
export async function fetchOnboardMetaInitial(limit = 30) {
  const [departments, designations, supervisors, workShifts, nextEmployeeNo, catalog] = await Promise.all([
    fetchDepartmentsMeta({ limit }),
    fetchDesignationsMeta({ limit }),
    fetchSupervisorsMeta({ limit }),
    fetchWorkShiftsMeta({ limit }),
    fetchNextEmployeeNumber(),
    api.get<import('@repo/types').CompanyCatalogView>('/operations/employer/catalog'),
  ]);

  return {
    departments: departments.data,
    designations: designations.data,
    supervisors: supervisors.data,
    workShifts: workShifts.data,
    branches: catalog.data.branches,
    nextEmployeeNo: nextEmployeeNo.data.employee_no,
  };
}

export type EmployeesListParams = {
  roster?: 'active' | 'past' | 'all';
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
  if (params.roster) query.set('roster', params.roster);
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

export async function fetchEmployeeDetails(employmentId: string): Promise<EmployeeEmploymentDTO> {
  const response = await api.get<EmployeeEmploymentDTO>(`/operations/employer/${employmentId}`);
  return response.data;
}

export async function updateEmployeeProfile(
  employmentId: string,
  payload: UpdateEmployeeProfilePayload,
): Promise<EmployeeEmploymentDTO> {
  const response = await api.patch<EmployeeEmploymentDTO>(
    `/operations/employer/${employmentId}/profile`,
    payload,
  );
  return response.data;
}

export type UploadFileResult = {
  fileKey: string;
  fileName: string;
  type: string;
  contentType: string;
  sizeBytes: number;
};

export type DocumentReadUrlResult = {
  fileKey: string;
  downloadUrl: string;
  expiresInSeconds: number;
};

/** POST /uploads — private employee docs (PAN, Aadhaar, etc.) */
export async function uploadEmployeeDocument(file: File): Promise<UploadFileResult> {
  const formData = new FormData();
  formData.append('type', 'userPrivateDocs');
  formData.append('file', file);
  const response = await api.upload<UploadFileResult>('/uploads', formData);
  return response.data;
}

/** POST /uploads/read-url — temporary 5-minute view/download URL */
export async function fetchDocumentReadUrl(fileKey: string): Promise<DocumentReadUrlResult> {
  const response = await api.post<DocumentReadUrlResult>('/uploads/read-url', { fileKey });
  return response.data;
}

export type AddEmployeeDocumentInput = {
  document_type: string;
  document_number?: string;
  file_key: string;
  file_name?: string;
  expiry_date?: string;
};

export async function addEmployeeDocument(
  employmentId: string,
  payload: AddEmployeeDocumentInput,
): Promise<EmployeeEmploymentDTO> {
  const response = await api.post<EmployeeEmploymentDTO>(
    `/operations/employer/${employmentId}/documents`,
    payload,
  );
  return response.data;
}

export type EmployeeImportResult = {
  total: number;
  created: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

export async function downloadEmployeeImportTemplate() {
  const { getAccessToken } = await import('@/lib/auth-tokens');
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const token = getAccessToken();
  const response = await fetch(`${base}/operations/employer/employees/import/template`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('Could not download template');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kbdl-employee-onboard-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export async function importEmployeesSpreadsheet(file: File): Promise<EmployeeImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.upload<EmployeeImportResult>(
    '/operations/employer/employees/import',
    formData,
  );
  return response.data;
}
