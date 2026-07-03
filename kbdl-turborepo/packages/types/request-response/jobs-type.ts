import { Job, JobApplication, Prisma } from '@repo/db/server';
import { safeEmployerSelect, safeUserSelect } from '@repo/db/shared';
import {
  adminUpdateJobApplicationStatusSchema,
  adminUpdateJobStatusSchema,
  applyForJobSchema,
  closeJobSchema,
  createJobSchema,
  deleteJobSchema,
  duplicateJobSchema,
  expireJobSchema,
  getAllJobApplicationsForAdminSchema,
  getAllJobsForAdminSchema,
  getEmployerJobByIdSchema,
  getEmployerJobsSchema,
  getJobApplicationByIdSchema,
  getJobApplicationsSchema,
  getJobByIdSchema,
  getJobsSchema,
  getLatestJobsSchema,
  getMyJobApplicationByIdSchema,
  getMyJobApplicationsSchema,
  getRecommendedJobsSchema,
  hireJobApplicationSchema,
  markJobApplicationUnderReviewSchema,
  pauseJobSchema,
  publishJobSchema,
  rejectJobApplicationSchema,
  scheduleJobApplicationInterviewSchema,
  selectJobApplicationSchema,
  shortlistJobApplicationSchema,
  updateJobApplicationNotesSchema,
  updateJobApplicationStatusSchema,
  updateJobSchema,
  updateJobStatusSchema,
  updateMyJobApplicationSchema,
  withdrawJobApplicationSchema,
} from '@repo/validator/shared';
import { z } from 'zod';

export type JobEmployerDTO = Prisma.EmployerGetPayload<{
  select: typeof safeEmployerSelect;
}>;

export type JobUserDTO = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

export type JobDTO = Job;

export type JobWithPosterDTO = Job & {
  employer: JobEmployerDTO | null;
  user: JobUserDTO | null;
  application_count?: number;
  hire_count?: number;
};

export type JobDetailsDTO = JobWithPosterDTO & {
  applications?: JobApplication[];
};

export type JobApplicationDTO = JobApplication;

export type JobApplicationWithRelationsDTO = JobApplication & {
  job: JobWithPosterDTO;
  user: JobUserDTO;
};

// --- Job Board ---
export type GetJobsRequest = z.infer<typeof getJobsSchema>;
export type GetJobsQuery = z.infer<typeof getJobsSchema>['query'];
export type GetJobsResponse = JobWithPosterDTO[];

export type GetLatestJobsRequest = z.infer<typeof getLatestJobsSchema>;
export type GetLatestJobsQuery = z.infer<typeof getLatestJobsSchema>['query'];
export type GetLatestJobsResponse = JobWithPosterDTO[];

export type GetRecommendedJobsRequest = z.infer<typeof getRecommendedJobsSchema>;
export type GetRecommendedJobsQuery = z.infer<typeof getRecommendedJobsSchema>['query'];
export type GetRecommendedJobsResponse = JobWithPosterDTO[];

export type GetJobByIdRequest = z.infer<typeof getJobByIdSchema>;
export type GetJobByIdParams = z.infer<typeof getJobByIdSchema>['params'];
export type GetJobByIdResponse = JobDetailsDTO;

export type ApplyForJobRequest = z.infer<typeof applyForJobSchema>;
export type ApplyForJobParams = z.infer<typeof applyForJobSchema>['params'];
export type ApplyForJobPayload = z.infer<typeof applyForJobSchema>['body'];
export type ApplyForJobResponse = JobApplicationDTO;

// --- Employer Jobs ---
export type CreateJobRequest = z.infer<typeof createJobSchema>;
export type CreateJobPayload = z.infer<typeof createJobSchema>['body'];
export type CreateJobResponse = JobDTO;

export type GetEmployerJobsRequest = z.infer<typeof getEmployerJobsSchema>;
export type GetEmployerJobsQuery = z.infer<typeof getEmployerJobsSchema>['query'];
export type GetEmployerJobsResponse = JobWithPosterDTO[];

export type GetEmployerJobByIdRequest = z.infer<typeof getEmployerJobByIdSchema>;
export type GetEmployerJobByIdParams = z.infer<typeof getEmployerJobByIdSchema>['params'];
export type GetEmployerJobByIdResponse = JobDetailsDTO;

export type UpdateJobRequest = z.infer<typeof updateJobSchema>;
export type UpdateJobParams = z.infer<typeof updateJobSchema>['params'];
export type UpdateJobPayload = z.infer<typeof updateJobSchema>['body'];
export type UpdateJobResponse = JobDTO;

export type DeleteJobRequest = z.infer<typeof deleteJobSchema>;
export type DeleteJobParams = z.infer<typeof deleteJobSchema>['params'];
export type DeleteJobResponse = JobDTO;

export type DuplicateJobRequest = z.infer<typeof duplicateJobSchema>;
export type DuplicateJobParams = z.infer<typeof duplicateJobSchema>['params'];
export type DuplicateJobResponse = JobDTO;

export type UpdateJobStatusRequest = z.infer<typeof updateJobStatusSchema>;
export type UpdateJobStatusParams = z.infer<typeof updateJobStatusSchema>['params'];
export type UpdateJobStatusPayload = z.infer<typeof updateJobStatusSchema>['body'];
export type UpdateJobStatusResponse = JobDTO;

export type PublishJobRequest = z.infer<typeof publishJobSchema>;
export type PublishJobParams = z.infer<typeof publishJobSchema>['params'];
export type PublishJobResponse = JobDTO;

export type PauseJobRequest = z.infer<typeof pauseJobSchema>;
export type PauseJobParams = z.infer<typeof pauseJobSchema>['params'];
export type PauseJobResponse = JobDTO;

export type CloseJobRequest = z.infer<typeof closeJobSchema>;
export type CloseJobParams = z.infer<typeof closeJobSchema>['params'];
export type CloseJobResponse = JobDTO;

export type ExpireJobRequest = z.infer<typeof expireJobSchema>;
export type ExpireJobParams = z.infer<typeof expireJobSchema>['params'];
export type ExpireJobResponse = JobDTO;

// --- Employer Applications ---
export type GetJobApplicationsRequest = z.infer<typeof getJobApplicationsSchema>;
export type GetJobApplicationsParams = z.infer<typeof getJobApplicationsSchema>['params'];
export type GetJobApplicationsQuery = z.infer<typeof getJobApplicationsSchema>['query'];
export type GetJobApplicationsResponse = JobApplicationWithRelationsDTO[];

export type GetJobApplicationByIdRequest = z.infer<typeof getJobApplicationByIdSchema>;
export type GetJobApplicationByIdParams = z.infer<typeof getJobApplicationByIdSchema>['params'];
export type GetJobApplicationByIdResponse = JobApplicationWithRelationsDTO;

export type UpdateJobApplicationStatusRequest = z.infer<typeof updateJobApplicationStatusSchema>;
export type UpdateJobApplicationStatusParams = z.infer<
  typeof updateJobApplicationStatusSchema
>['params'];
export type UpdateJobApplicationStatusPayload = z.infer<
  typeof updateJobApplicationStatusSchema
>['body'];
export type UpdateJobApplicationStatusResponse = JobApplicationDTO;

export type UpdateJobApplicationNotesRequest = z.infer<typeof updateJobApplicationNotesSchema>;
export type UpdateJobApplicationNotesParams = z.infer<
  typeof updateJobApplicationNotesSchema
>['params'];
export type UpdateJobApplicationNotesPayload = z.infer<
  typeof updateJobApplicationNotesSchema
>['body'];
export type UpdateJobApplicationNotesResponse = JobApplicationDTO;

export type MarkJobApplicationUnderReviewRequest = z.infer<
  typeof markJobApplicationUnderReviewSchema
>;
export type MarkJobApplicationUnderReviewParams = z.infer<
  typeof markJobApplicationUnderReviewSchema
>['params'];
export type MarkJobApplicationUnderReviewPayload = z.infer<
  typeof markJobApplicationUnderReviewSchema
>['body'];
export type MarkJobApplicationUnderReviewResponse = JobApplicationDTO;

export type ShortlistJobApplicationRequest = z.infer<typeof shortlistJobApplicationSchema>;
export type ShortlistJobApplicationParams = z.infer<typeof shortlistJobApplicationSchema>['params'];
export type ShortlistJobApplicationPayload = z.infer<typeof shortlistJobApplicationSchema>['body'];
export type ShortlistJobApplicationResponse = JobApplicationDTO;

export type ScheduleJobApplicationInterviewRequest = z.infer<
  typeof scheduleJobApplicationInterviewSchema
>;
export type ScheduleJobApplicationInterviewParams = z.infer<
  typeof scheduleJobApplicationInterviewSchema
>['params'];
export type ScheduleJobApplicationInterviewPayload = z.infer<
  typeof scheduleJobApplicationInterviewSchema
>['body'];
export type ScheduleJobApplicationInterviewResponse = JobApplicationDTO;

export type SelectJobApplicationRequest = z.infer<typeof selectJobApplicationSchema>;
export type SelectJobApplicationParams = z.infer<typeof selectJobApplicationSchema>['params'];
export type SelectJobApplicationPayload = z.infer<typeof selectJobApplicationSchema>['body'];
export type SelectJobApplicationResponse = JobApplicationDTO;

export type HireJobApplicationRequest = z.infer<typeof hireJobApplicationSchema>;
export type HireJobApplicationParams = z.infer<typeof hireJobApplicationSchema>['params'];
export type HireJobApplicationPayload = z.infer<typeof hireJobApplicationSchema>['body'];
export type HireJobApplicationResponse = JobApplicationDTO;

export type RejectJobApplicationRequest = z.infer<typeof rejectJobApplicationSchema>;
export type RejectJobApplicationParams = z.infer<typeof rejectJobApplicationSchema>['params'];
export type RejectJobApplicationPayload = z.infer<typeof rejectJobApplicationSchema>['body'];
export type RejectJobApplicationResponse = JobApplicationDTO;

// --- Worker Applications ---
export type GetMyJobApplicationsRequest = z.infer<typeof getMyJobApplicationsSchema>;
export type GetMyJobApplicationsQuery = z.infer<typeof getMyJobApplicationsSchema>['query'];
export type GetMyJobApplicationsResponse = JobApplicationWithRelationsDTO[];

export type GetMyJobApplicationByIdRequest = z.infer<typeof getMyJobApplicationByIdSchema>;
export type GetMyJobApplicationByIdParams = z.infer<typeof getMyJobApplicationByIdSchema>['params'];
export type GetMyJobApplicationByIdResponse = JobApplicationWithRelationsDTO;

export type UpdateMyJobApplicationRequest = z.infer<typeof updateMyJobApplicationSchema>;
export type UpdateMyJobApplicationParams = z.infer<typeof updateMyJobApplicationSchema>['params'];
export type UpdateMyJobApplicationPayload = z.infer<typeof updateMyJobApplicationSchema>['body'];
export type UpdateMyJobApplicationResponse = JobApplicationDTO;

export type WithdrawJobApplicationRequest = z.infer<typeof withdrawJobApplicationSchema>;
export type WithdrawJobApplicationParams = z.infer<typeof withdrawJobApplicationSchema>['params'];
export type WithdrawJobApplicationResponse = JobApplicationDTO;

// --- Admin Moderation ---
export type GetAllJobsForAdminRequest = z.infer<typeof getAllJobsForAdminSchema>;
export type GetAllJobsForAdminQuery = z.infer<typeof getAllJobsForAdminSchema>['query'];
export type GetAllJobsForAdminResponse = JobWithPosterDTO[];

export type GetAllJobApplicationsForAdminRequest = z.infer<
  typeof getAllJobApplicationsForAdminSchema
>;
export type GetAllJobApplicationsForAdminQuery = z.infer<
  typeof getAllJobApplicationsForAdminSchema
>['query'];
export type GetAllJobApplicationsForAdminResponse = JobApplicationWithRelationsDTO[];

export type AdminUpdateJobStatusRequest = z.infer<typeof adminUpdateJobStatusSchema>;
export type AdminUpdateJobStatusParams = z.infer<typeof adminUpdateJobStatusSchema>['params'];
export type AdminUpdateJobStatusPayload = z.infer<typeof adminUpdateJobStatusSchema>['body'];
export type AdminUpdateJobStatusResponse = JobDTO;

export type AdminUpdateJobApplicationStatusRequest = z.infer<
  typeof adminUpdateJobApplicationStatusSchema
>;
export type AdminUpdateJobApplicationStatusParams = z.infer<
  typeof adminUpdateJobApplicationStatusSchema
>['params'];
export type AdminUpdateJobApplicationStatusPayload = z.infer<
  typeof adminUpdateJobApplicationStatusSchema
>['body'];
export type AdminUpdateJobApplicationStatusResponse = JobApplicationDTO;
