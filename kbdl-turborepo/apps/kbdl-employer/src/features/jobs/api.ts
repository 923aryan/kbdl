import { api } from '@/lib/api-client';

export type EmployerJob = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  employment_type?: string;
  work_type?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_type?: string;
  is_negotiable?: boolean;
  job_start_time?: string | null;
  job_end_time?: string | null;
  address?: string | null;
  seats_available?: number | null;
  expires_at?: string | null;
  created_at?: string | null;
  employer?: { name?: string | null } | null;
};

export type JobApplication = {
  id: string;
  status: string;
  applied_at?: string | null;
  employer_notes?: string | null;
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
};

export async function getEmployerJobs(options: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  employment_type?: string;
  work_type?: string;
}) {
  const params = new URLSearchParams();
  params.set('page', String(options.page ?? 1));
  params.set('limit', String(options.limit ?? 10));

  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  if (options.employment_type) params.set('employment_type', options.employment_type);
  if (options.work_type) params.set('work_type', options.work_type);

  const response = await api.get<EmployerJob[]>(`/jobs/employer?${params.toString()}`);

  return {
    jobs: response.data,
    meta: response.meta as { total?: number; page?: number; pageSize?: number },
  };
}

export async function createEmployerJob(payload: {
  title: string;
  description: string;
  employment_type: string;
  work_type: string;
  salary_type: string;
  salary_min?: number;
  salary_max?: number;
  is_negotiable?: boolean;
  job_start_time?: string;
  job_end_time?: string;
  address?: string;
  seats_available?: number;
  status?: string;
}) {
  const response = await api.post<EmployerJob>('/jobs/employer', payload);
  return response.data;
}

export async function getJobApplications(jobId: string, page = 1, limit = 10) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  const response = await api.get<JobApplication[]>(
    `/jobs/employer/${jobId}/applications?${params.toString()}`,
  );

  return {
    applications: response.data,
    meta: response.meta as { total?: number; page?: number; pageSize?: number },
  };
}
