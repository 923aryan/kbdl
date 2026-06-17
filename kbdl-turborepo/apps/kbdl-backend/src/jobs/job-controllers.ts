import {
  AdminUpdateJobApplicationStatusRequest,
  AdminUpdateJobStatusRequest,
  ApplyForJobRequest,
  CloseJobRequest,
  CreateJobRequest,
  DeleteJobRequest,
  DuplicateJobRequest,
  ExpireJobRequest,
  GetAllJobApplicationsForAdminRequest,
  GetAllJobsForAdminRequest,
  GetEmployerJobByIdRequest,
  GetEmployerJobsRequest,
  GetJobApplicationByIdRequest,
  GetJobApplicationsRequest,
  GetJobByIdRequest,
  GetJobsRequest,
  GetLatestJobsRequest,
  GetMyJobApplicationByIdRequest,
  GetMyJobApplicationsRequest,
  GetRecommendedJobsRequest,
  HireJobApplicationRequest,
  MarkJobApplicationUnderReviewRequest,
  PauseJobRequest,
  PublishJobRequest,
  RejectJobApplicationRequest,
  ScheduleJobApplicationInterviewRequest,
  SelectJobApplicationRequest,
  ShortlistJobApplicationRequest,
  UpdateJobApplicationNotesRequest,
  UpdateJobApplicationStatusRequest,
  UpdateJobRequest,
  UpdateJobStatusRequest,
  UpdateMyJobApplicationRequest,
  WithdrawJobApplicationRequest,
} from '@repo/types';
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
import { Request, Response } from 'express';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import {
  adminUpdateJobApplicationStatusService,
  adminUpdateJobStatusService,
  applyForJobService,
  closeJobService,
  createJobService,
  deleteJobService,
  duplicateJobService,
  expireJobService,
  getAllJobApplicationsForAdminService,
  getAllJobsForAdminService,
  getEmployerJobByIdService,
  getEmployerJobsService,
  getJobApplicationByIdService,
  getJobApplicationsService,
  getJobByIdService,
  getJobsService,
  getLatestJobsService,
  getMyJobApplicationByIdService,
  getMyJobApplicationsService,
  getRecommendedJobsService,
  hireJobApplicationService,
  markJobApplicationUnderReviewService,
  pauseJobService,
  publishJobService,
  rejectJobApplicationService,
  scheduleJobApplicationInterviewService,
  selectJobApplicationService,
  shortlistJobApplicationService,
  updateJobApplicationNotesService,
  updateJobApplicationStatusService,
  updateJobService,
  updateJobStatusService,
  updateMyJobApplicationService,
  withdrawJobApplicationService,
} from './job-services';

const getAuthenticatedUserId = (req: Request) => req.payload.user.id;
const getAuthenticatedEmployerId = (req: Request) => req.payload.employer.id;

export const getJobs = async (req: Request, res: Response) => {
  const input: GetJobsRequest = validate(getJobsSchema, req);
  const { jobs, meta } = await getJobsService(input.query);
  sendSuccess(res, 'Jobs retrieved successfully', jobs, 200, meta);
};

export const getLatestJobs = async (req: Request, res: Response) => {
  const input: GetLatestJobsRequest = validate(getLatestJobsSchema, req);
  const { jobs, meta } = await getLatestJobsService(input.query);
  sendSuccess(res, 'Latest jobs retrieved successfully', jobs, 200, meta);
};

export const getRecommendedJobs = async (req: Request, res: Response) => {
  const input: GetRecommendedJobsRequest = validate(getRecommendedJobsSchema, req);
  const userId = getAuthenticatedUserId(req);
  const { jobs, meta } = await getRecommendedJobsService(userId, input.query);
  sendSuccess(res, 'Recommended jobs retrieved successfully', jobs, 200, meta);
};

export const getJobById = async (req: Request, res: Response) => {
  const input: GetJobByIdRequest = validate(getJobByIdSchema, req);
  const job = await getJobByIdService(input.params.id);
  sendSuccess(res, 'Job retrieved successfully', job);
};

export const applyForJob = async (req: Request, res: Response) => {
  const input: ApplyForJobRequest = validate(applyForJobSchema, req);
  const userId = getAuthenticatedUserId(req);
  const application = await applyForJobService(userId, input.params.id, input.body);
  sendSuccess(res, 'Job application submitted successfully', application, 201);
};

export const createJob = async (req: Request, res: Response) => {
  const input: CreateJobRequest = validate(createJobSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await createJobService(employerId, input.body);
  sendSuccess(res, 'Job created successfully', job, 201);
};

export const getEmployerJobs = async (req: Request, res: Response) => {
  const input: GetEmployerJobsRequest = validate(getEmployerJobsSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const { jobs, meta } = await getEmployerJobsService(employerId, input.query);
  sendSuccess(res, 'Employer jobs retrieved successfully', jobs, 200, meta);
};

export const getEmployerJobById = async (req: Request, res: Response) => {
  const input: GetEmployerJobByIdRequest = validate(getEmployerJobByIdSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await getEmployerJobByIdService(employerId, input.params.id);
  sendSuccess(res, 'Employer job retrieved successfully', job);
};

export const updateJob = async (req: Request, res: Response) => {
  const input: UpdateJobRequest = validate(updateJobSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await updateJobService(employerId, input.params.id, input.body);
  sendSuccess(res, 'Job updated successfully', job);
};

export const deleteJob = async (req: Request, res: Response) => {
  const input: DeleteJobRequest = validate(deleteJobSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await deleteJobService(employerId, input.params.id);
  sendSuccess(res, 'Job deleted successfully', job);
};

export const duplicateJob = async (req: Request, res: Response) => {
  const input: DuplicateJobRequest = validate(duplicateJobSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await duplicateJobService(employerId, input.params.id);
  sendSuccess(res, 'Job duplicated successfully', job, 201);
};

export const updateJobStatus = async (req: Request, res: Response) => {
  const input: UpdateJobStatusRequest = validate(updateJobStatusSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await updateJobStatusService(employerId, input.params.id, input.body);
  sendSuccess(res, 'Job status updated successfully', job);
};

export const publishJob = async (req: Request, res: Response) => {
  const input: PublishJobRequest = validate(publishJobSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await publishJobService(employerId, input.params.id);
  sendSuccess(res, 'Job published successfully', job);
};

export const pauseJob = async (req: Request, res: Response) => {
  const input: PauseJobRequest = validate(pauseJobSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await pauseJobService(employerId, input.params.id);
  sendSuccess(res, 'Job paused successfully', job);
};

export const closeJob = async (req: Request, res: Response) => {
  const input: CloseJobRequest = validate(closeJobSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await closeJobService(employerId, input.params.id);
  sendSuccess(res, 'Job closed successfully', job);
};

export const expireJob = async (req: Request, res: Response) => {
  const input: ExpireJobRequest = validate(expireJobSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const job = await expireJobService(employerId, input.params.id);
  sendSuccess(res, 'Job expired successfully', job);
};

export const getJobApplications = async (req: Request, res: Response) => {
  const input: GetJobApplicationsRequest = validate(getJobApplicationsSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const { applications, meta } = await getJobApplicationsService(
    employerId,
    input.params.id,
    input.query,
  );
  sendSuccess(res, 'Job applications retrieved successfully', applications, 200, meta);
};

export const getJobApplicationById = async (req: Request, res: Response) => {
  const input: GetJobApplicationByIdRequest = validate(getJobApplicationByIdSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const application = await getJobApplicationByIdService(
    employerId,
    input.params.id,
    input.params.applicationId,
  );
  sendSuccess(res, 'Job application retrieved successfully', application);
};

export const updateJobApplicationStatus = async (req: Request, res: Response) => {
  const input: UpdateJobApplicationStatusRequest = validate(updateJobApplicationStatusSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const application = await updateJobApplicationStatusService(
    employerId,
    input.params.id,
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'Job application status updated successfully', application);
};

export const updateJobApplicationNotes = async (req: Request, res: Response) => {
  const input: UpdateJobApplicationNotesRequest = validate(updateJobApplicationNotesSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const application = await updateJobApplicationNotesService(
    employerId,
    input.params.id,
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'Job application notes updated successfully', application);
};

export const markJobApplicationUnderReview = async (req: Request, res: Response) => {
  const input: MarkJobApplicationUnderReviewRequest = validate(
    markJobApplicationUnderReviewSchema,
    req,
  );
  const employerId = getAuthenticatedEmployerId(req);
  const application = await markJobApplicationUnderReviewService(
    employerId,
    input.params.id,
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'Job application marked under review successfully', application);
};

export const shortlistJobApplication = async (req: Request, res: Response) => {
  const input: ShortlistJobApplicationRequest = validate(shortlistJobApplicationSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const application = await shortlistJobApplicationService(
    employerId,
    input.params.id,
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'Job application shortlisted successfully', application);
};

export const scheduleJobApplicationInterview = async (req: Request, res: Response) => {
  const input: ScheduleJobApplicationInterviewRequest = validate(
    scheduleJobApplicationInterviewSchema,
    req,
  );
  const employerId = getAuthenticatedEmployerId(req);
  const application = await scheduleJobApplicationInterviewService(
    employerId,
    input.params.id,
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'Job application interview scheduled successfully', application);
};

export const selectJobApplication = async (req: Request, res: Response) => {
  const input: SelectJobApplicationRequest = validate(selectJobApplicationSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const application = await selectJobApplicationService(
    employerId,
    input.params.id,
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'Job application selected successfully', application);
};

export const hireJobApplication = async (req: Request, res: Response) => {
  const input: HireJobApplicationRequest = validate(hireJobApplicationSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const application = await hireJobApplicationService(
    employerId,
    input.params.id,
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'Job application hired successfully', application);
};

export const rejectJobApplication = async (req: Request, res: Response) => {
  const input: RejectJobApplicationRequest = validate(rejectJobApplicationSchema, req);
  const employerId = getAuthenticatedEmployerId(req);
  const application = await rejectJobApplicationService(
    employerId,
    input.params.id,
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'Job application rejected successfully', application);
};

export const getMyJobApplications = async (req: Request, res: Response) => {
  const input: GetMyJobApplicationsRequest = validate(getMyJobApplicationsSchema, req);
  const userId = getAuthenticatedUserId(req);
  const { applications, meta } = await getMyJobApplicationsService(userId, input.query);
  sendSuccess(res, 'My job applications retrieved successfully', applications, 200, meta);
};

export const getMyJobApplicationById = async (req: Request, res: Response) => {
  const input: GetMyJobApplicationByIdRequest = validate(getMyJobApplicationByIdSchema, req);
  const userId = getAuthenticatedUserId(req);
  const application = await getMyJobApplicationByIdService(userId, input.params.applicationId);
  sendSuccess(res, 'My job application retrieved successfully', application);
};

export const updateMyJobApplication = async (req: Request, res: Response) => {
  const input: UpdateMyJobApplicationRequest = validate(updateMyJobApplicationSchema, req);
  const userId = getAuthenticatedUserId(req);
  const application = await updateMyJobApplicationService(
    userId,
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'My job application updated successfully', application);
};

export const withdrawJobApplication = async (req: Request, res: Response) => {
  const input: WithdrawJobApplicationRequest = validate(withdrawJobApplicationSchema, req);
  const userId = getAuthenticatedUserId(req);
  const application = await withdrawJobApplicationService(userId, input.params.applicationId);
  sendSuccess(res, 'Job application withdrawn successfully', application);
};

export const getAllJobsForAdmin = async (req: Request, res: Response) => {
  const input: GetAllJobsForAdminRequest = validate(getAllJobsForAdminSchema, req);
  const { jobs, meta } = await getAllJobsForAdminService(input.query);
  sendSuccess(res, 'Admin jobs retrieved successfully', jobs, 200, meta);
};

export const getAllJobApplicationsForAdmin = async (req: Request, res: Response) => {
  const input: GetAllJobApplicationsForAdminRequest = validate(
    getAllJobApplicationsForAdminSchema,
    req,
  );
  const { applications, meta } = await getAllJobApplicationsForAdminService(input.query);
  sendSuccess(res, 'Admin job applications retrieved successfully', applications, 200, meta);
};

export const adminUpdateJobStatus = async (req: Request, res: Response) => {
  const input: AdminUpdateJobStatusRequest = validate(adminUpdateJobStatusSchema, req);
  const job = await adminUpdateJobStatusService(input.params.id, input.body);
  sendSuccess(res, 'Admin job status updated successfully', job);
};

export const adminUpdateJobApplicationStatus = async (req: Request, res: Response) => {
  const input: AdminUpdateJobApplicationStatusRequest = validate(
    adminUpdateJobApplicationStatusSchema,
    req,
  );
  const application = await adminUpdateJobApplicationStatusService(
    input.params.applicationId,
    input.body,
  );
  sendSuccess(res, 'Admin job application status updated successfully', application);
};
