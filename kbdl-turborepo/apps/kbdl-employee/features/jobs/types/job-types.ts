import type {
  GetJobByIdResponse,
  GetLatestJobsResponse,
  GetMyJobApplicationsResponse,
} from '@repo/types';

export type EmployeeJob = GetLatestJobsResponse[number];
export type EmployeeJobDetails = GetJobByIdResponse;
export type EmployeeJobApplication = GetMyJobApplicationsResponse[number];
export type JobFeedType = 'latest' | 'recommended';
