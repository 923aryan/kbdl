import { api } from '@/lib/api/api-client';
import type {
  ApplyForJobPayload,
  ApplyForJobResponse,
  GetJobByIdResponse,
  GetJobsResponse,
  GetLatestJobsResponse,
  GetMyJobApplicationsResponse,
  GetRecommendedJobsResponse,
  WithdrawJobApplicationResponse,
} from '@repo/types';
import { useMutation, useQuery } from '@tanstack/react-query';

const toQueryString = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  return search.toString();
};

export const jobQueryKeys = {
  all: ['employee-jobs'] as const,
  latest: ['employee-jobs', 'latest'] as const,
  recommended: ['employee-jobs', 'recommended'] as const,
  applications: ['employee-jobs', 'applications'] as const,
  detail: (id: string) => ['employee-jobs', 'detail', id] as const,
};

export const useGetLatestJobs = (limit = 10) =>
  useQuery({
    queryKey: [...jobQueryKeys.latest, limit] as const,
    queryFn: async () => (await api.get<GetLatestJobsResponse>(`/jobs/latest?limit=${limit}`)).data,
  });

export const useGetRecommendedJobs = (limit = 10) =>
  useQuery({
    queryKey: [...jobQueryKeys.recommended, limit] as const,
    queryFn: async () => (await api.get<GetRecommendedJobsResponse>(`/jobs/recommended?limit=${limit}`)).data,
  });

export const useGetJobs = (search?: string) =>
  useQuery({
    queryKey: [...jobQueryKeys.all, search] as const,
    queryFn: async () => {
      const query = toQueryString({ limit: 20, search: search?.trim() || undefined });
      return (await api.get<GetJobsResponse>(`/jobs?${query}`)).data;
    },
  });

export const useGetJobDetails = (jobId: string) =>
  useQuery({
    queryKey: jobQueryKeys.detail(jobId),
    queryFn: async () => (await api.get<GetJobByIdResponse>(`/jobs/${jobId}`)).data,
    enabled: Boolean(jobId),
  });

export const useApplyForJob = () =>
  useMutation({
    mutationFn: async ({ jobId, payload }: { jobId: string; payload: ApplyForJobPayload }) =>
      (await api.post<ApplyForJobResponse>(`/jobs/${jobId}/apply`, payload)).data,
  });

export const useGetMyJobApplications = () =>
  useQuery({
    queryKey: jobQueryKeys.applications,
    queryFn: async () => (await api.get<GetMyJobApplicationsResponse>('/jobs/applications/me?limit=50')).data,
  });

export const useWithdrawJobApplication = () =>
  useMutation({
    mutationFn: async (applicationId: string) =>
      (await api.patch<WithdrawJobApplicationResponse>(`/jobs/applications/me/${applicationId}/withdraw`, {}))
        .data,
  });
