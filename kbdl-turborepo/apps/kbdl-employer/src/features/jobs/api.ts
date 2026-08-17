'use client';

import { api } from '@/lib/api-client';
import type {
  CreateJobPayload,
  DeleteJobResponse,
  DuplicateJobResponse,
  GetEmployerJobByIdResponse,
  GetEmployerJobsResponse,
  GetJobApplicationsResponse,
  PublishJobResponse,
  UpdateJobPayload,
  UpdateJobResponse,
  UpdateJobStatusPayload,
  UpdateJobStatusResponse,
} from '@repo/types';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

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
  application_count?: number | null;
  hire_count?: number | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  employer?: {
    id?: string;
    name?: string | null;
    company_name?: string | null;
  } | null;
};

export type JobApplication = {
  id: string;
  status: string;
  applied_at?: string | null;
  employer_notes?: string | null;
  user?: {
    id?: string;
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone_no?: string | null;
    experience?: number | null;
    rating_avg?: number | string | null;
  } | null;
};

export type EmployerJobStats = {
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  totalApplications: number;
  hiresFromJobs: number;
};

export type GetEmployerJobsOptions = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  employment_type?: string;
  work_type?: string;
};

export type EmployerJobPayload = CreateJobPayload;
export type EmployerJobUpdatePayload = UpdateJobPayload;
export type EmployerJobStatusPayload = UpdateJobStatusPayload;

export type GetEmployerJobsResult = {
  jobs: EmployerJob[];
  meta: {
    total?: number;
    page?: number;
    limit?: number;
    pageSize?: number;
    stats?: EmployerJobStats;
  };
};

export type GetJobApplicationsResult = {
  applications: JobApplication[];
  meta: { total?: number; page?: number; pageSize?: number };
};

const toQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export async function getEmployerJobs(
  options: GetEmployerJobsOptions = {},
): Promise<GetEmployerJobsResult> {
  const queryString = toQueryString({
    page: options.page ?? 1,
    limit: options.limit ?? 10,
    status: options.status,
    search: options.search,
    employment_type: options.employment_type,
    work_type: options.work_type,
  });

  const response = await api.get<GetEmployerJobsResponse>(`/jobs/employer${queryString}`);

  return {
    jobs: response.data as unknown as EmployerJob[],
    meta: response.meta as GetEmployerJobsResult['meta'],
  };
}

export const createEmployerJob = async (payload: EmployerJobPayload): Promise<EmployerJob> => {
  const response = await api.post<GetEmployerJobByIdResponse>('/jobs/employer', payload);
  return response.data as unknown as EmployerJob;
};

export const getEmployerJob = async (jobId: string): Promise<EmployerJob> => {
  const response = await api.get<GetEmployerJobByIdResponse>(`/jobs/employer/${jobId}`);
  return response.data as unknown as EmployerJob;
};

export const updateEmployerJob = async (
  jobId: string,
  payload: EmployerJobUpdatePayload,
): Promise<EmployerJob> => {
  const response = await api.patch<UpdateJobResponse>(`/jobs/employer/${jobId}`, payload);
  return response.data as unknown as EmployerJob;
};

export const deleteEmployerJob = async (jobId: string): Promise<DeleteJobResponse> => {
  const response = await api.delete<DeleteJobResponse>(`/jobs/employer/${jobId}`);
  return response.data;
};

export const duplicateEmployerJob = async (jobId: string): Promise<DuplicateJobResponse> => {
  const response = await api.post<DuplicateJobResponse>(`/jobs/employer/${jobId}/duplicate`);
  return response.data;
};

export const updateEmployerJobStatus = async (
  jobId: string,
  payload: EmployerJobStatusPayload,
): Promise<EmployerJob> => {
  const response = await api.patch<UpdateJobStatusResponse>(
    `/jobs/employer/${jobId}/status`,
    payload,
  );
  return response.data as unknown as EmployerJob;
};

export const publishEmployerJob = async (jobId: string): Promise<EmployerJob> => {
  const response = await api.patch<PublishJobResponse>(`/jobs/employer/${jobId}/publish`);
  return response.data as unknown as EmployerJob;
};

export const pauseEmployerJob = async (jobId: string): Promise<EmployerJob> => {
  const response = await api.patch<UpdateJobStatusResponse>(`/jobs/employer/${jobId}/pause`);
  return response.data as unknown as EmployerJob;
};

export const closeEmployerJob = async (jobId: string): Promise<EmployerJob> => {
  const response = await api.patch<UpdateJobStatusResponse>(`/jobs/employer/${jobId}/close`);
  return response.data as unknown as EmployerJob;
};

export const expireEmployerJob = async (jobId: string): Promise<EmployerJob> => {
  const response = await api.patch<UpdateJobStatusResponse>(`/jobs/employer/${jobId}/expire`);
  return response.data as unknown as EmployerJob;
};

export const getJobApplications = async (
  jobId: string,
  page = 1,
  limit = 10,
): Promise<GetJobApplicationsResult> => {
  const queryString = toQueryString({ page, limit });

  const response = await api.get<GetJobApplicationsResponse>(
    `/jobs/employer/${jobId}/applications${queryString}`,
  );

  return {
    applications: response.data as unknown as JobApplication[],
    meta: response.meta as { total?: number; page?: number; pageSize?: number },
  };
};

export const selectJobApplication = async (
  jobId: string,
  applicationId: string,
  payload: { employer_notes?: string } = {},
): Promise<JobApplication> => {
  const response = await api.patch<JobApplication>(
    `/jobs/employer/${jobId}/applications/${applicationId}/select`,
    payload,
  );
  return response.data;
};

export const rejectJobApplication = async (
  jobId: string,
  applicationId: string,
  payload: { employer_notes?: string } = {},
): Promise<JobApplication> => {
  const response = await api.patch<JobApplication>(
    `/jobs/employer/${jobId}/applications/${applicationId}/reject`,
    payload,
  );
  return response.data;
};

export const hireJobApplication = async (
  jobId: string,
  applicationId: string,
  payload: { employer_notes?: string } = {},
): Promise<JobApplication> => {
  const response = await api.patch<JobApplication>(
    `/jobs/employer/${jobId}/applications/${applicationId}/hire`,
    payload,
  );
  return response.data;
};

export const employerJobsQueryKey = (options: GetEmployerJobsOptions = {}) => [
  'employer-jobs',
  options,
];

export const employerJobQueryKey = (jobId?: string) => ['employer-job', jobId];

export const jobApplicationsQueryKey = (jobId?: string, page = 1, limit = 10) => [
  'job-applications',
  jobId,
  page,
  limit,
];

export const useGetEmployerJobs = (
  options: GetEmployerJobsOptions = {},
): UseQueryResult<GetEmployerJobsResult, Error> => {
  return useQuery({
    queryKey: employerJobsQueryKey(options),
    queryFn: () => getEmployerJobs(options),
  });
};

export const useGetEmployerJob = (jobId?: string): UseQueryResult<EmployerJob, Error> => {
  return useQuery({
    queryKey: employerJobQueryKey(jobId),
    queryFn: () => getEmployerJob(jobId as string),
    enabled: Boolean(jobId),
  });
};

export const useCreateEmployerJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: EmployerJobPayload) => {
      const response = await api.post<GetEmployerJobByIdResponse>('/jobs/employer', payload);
      return response.data as unknown as EmployerJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
    },
  });
};

export const useUpdateEmployerJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      payload,
    }: {
      jobId: string;
      payload: EmployerJobUpdatePayload;
    }) => {
      const response = await api.patch<UpdateJobResponse>(`/jobs/employer/${jobId}`, payload);
      return response.data as unknown as EmployerJob;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      queryClient.invalidateQueries({ queryKey: employerJobQueryKey(job.id) });
    },
  });
};

export const useUpdateEmployerJobStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      payload,
    }: {
      jobId: string;
      payload: EmployerJobStatusPayload;
    }) => {
      const response = await api.patch<UpdateJobStatusResponse>(
        `/jobs/employer/${jobId}/status`,
        payload,
      );
      return response.data as unknown as EmployerJob;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      queryClient.invalidateQueries({ queryKey: employerJobQueryKey(job.id) });
    },
  });
};

export const useDeleteEmployerJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.delete<DeleteJobResponse>(`/jobs/employer/${jobId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
    },
  });
};

export const useGetJobApplications = (
  jobId?: string,
  page = 1,
  limit = 10,
): UseQueryResult<GetJobApplicationsResult, Error> => {
  return useQuery({
    queryKey: jobApplicationsQueryKey(jobId, page, limit),
    queryFn: () => getJobApplications(jobId as string, page, limit),
    enabled: Boolean(jobId),
  });
};
