import { Router } from 'express';

import { authenticate } from '../middleware/auth-middleware';
import { ROLES } from '../utils/constants';
import {
  adminUpdateJobApplicationStatus,
  adminUpdateJobStatus,
  applyForJob,
  closeJob,
  createJob,
  deleteJob,
  duplicateJob,
  expireJob,
  getAllJobApplicationsForAdmin,
  getAllJobsForAdmin,
  getEmployerJobById,
  getEmployerJobs,
  getJobApplicationById,
  getJobApplications,
  getJobById,
  getJobs,
  getLatestJobs,
  getMyJobApplicationById,
  getMyJobApplications,
  getRecommendedJobs,
  hireJobApplication,
  markJobApplicationUnderReview,
  pauseJob,
  publishJob,
  rejectJobApplication,
  scheduleJobApplicationInterview,
  selectJobApplication,
  shortlistJobApplication,
  updateJob,
  updateJobApplicationNotes,
  updateJobApplicationStatus,
  updateJobStatus,
  updateMyJobApplication,
  withdrawJobApplication,
} from './job-controllers';

const jobRouter: Router = Router();

// --- Job Board ---
// Lists jobs with filters such as status, employment_type, work_type, salary_type, dates, location, and employer
jobRouter.get('/', authenticate([ROLES.USER, ROLES.EMPLOYER, ROLES.ADMIN]), getJobs);

// Retrieves newest open jobs for worker discovery feeds
jobRouter.get('/latest', authenticate([ROLES.USER]), getLatestJobs);

// Retrieves personalized job matches for the current worker
jobRouter.get('/recommended', authenticate([ROLES.USER]), getRecommendedJobs);

// --- Employer Jobs ---
// Creates a job owned by the current employer
jobRouter.post('/employer', authenticate([ROLES.EMPLOYER]), createJob);

// Lists jobs posted by the current employer with filters and pagination
jobRouter.get('/employer', authenticate([ROLES.EMPLOYER]), getEmployerJobs);

// Returns a single job owned by the current employer
jobRouter.get('/employer/:id', authenticate([ROLES.EMPLOYER]), getEmployerJobById);

// Updates editable job fields such as title, salary, schedule, address, seats, and expiry
jobRouter.patch('/employer/:id', authenticate([ROLES.EMPLOYER]), updateJob);

// Deletes a draft or otherwise removable job owned by the current employer
jobRouter.delete('/employer/:id', authenticate([ROLES.EMPLOYER]), deleteJob);

// Creates a new draft by copying an existing employer job
jobRouter.post('/employer/:id/duplicate', authenticate([ROLES.EMPLOYER]), duplicateJob);

// Handles generic JobStatus transitions: draft, open, paused, closed, expired
jobRouter.patch('/employer/:id/status', authenticate([ROLES.EMPLOYER]), updateJobStatus);

// Opens a draft or paused job for worker applications
jobRouter.patch('/employer/:id/publish', authenticate([ROLES.EMPLOYER]), publishJob);

// Temporarily stops new applications without closing the job permanently
jobRouter.patch('/employer/:id/pause', authenticate([ROLES.EMPLOYER]), pauseJob);

// Closes the job and stops new applications
jobRouter.patch('/employer/:id/close', authenticate([ROLES.EMPLOYER]), closeJob);

// Marks the job as expired, usually after expires_at passes
jobRouter.patch('/employer/:id/expire', authenticate([ROLES.EMPLOYER]), expireJob);

// --- Employer Applications ---
// Lists all applications for a specific employer-owned job
jobRouter.get('/employer/:id/applications', authenticate([ROLES.EMPLOYER]), getJobApplications);

// Returns one application tied to a specific employer-owned job
jobRouter.get(
  '/employer/:id/applications/:applicationId',
  authenticate([ROLES.EMPLOYER]),
  getJobApplicationById,
);

// Updates any valid JobApplicationStatus with optional employer notes or interview timestamp
jobRouter.patch(
  '/employer/:id/applications/:applicationId/status',
  authenticate([ROLES.EMPLOYER]),
  updateJobApplicationStatus,
);

// Updates recruiter notes without changing candidate status
jobRouter.patch(
  '/employer/:id/applications/:applicationId/notes',
  authenticate([ROLES.EMPLOYER]),
  updateJobApplicationNotes,
);

// Moves an application to under_review and stamps reviewed_at
jobRouter.patch(
  '/employer/:id/applications/:applicationId/review',
  authenticate([ROLES.EMPLOYER]),
  markJobApplicationUnderReview,
);

// Moves an application to shortlisted and stamps shortlisted_at
jobRouter.patch(
  '/employer/:id/applications/:applicationId/shortlist',
  authenticate([ROLES.EMPLOYER]),
  shortlistJobApplication,
);

// Schedules or reschedules an interview and stamps interview_at
jobRouter.patch(
  '/employer/:id/applications/:applicationId/interview',
  authenticate([ROLES.EMPLOYER]),
  scheduleJobApplicationInterview,
);

// Moves an application to selected before final hire
jobRouter.patch(
  '/employer/:id/applications/:applicationId/select',
  authenticate([ROLES.EMPLOYER]),
  selectJobApplication,
);

// Hires the applicant, stamps hired_at, and can decrement seats_available
jobRouter.patch(
  '/employer/:id/applications/:applicationId/hire',
  authenticate([ROLES.EMPLOYER]),
  hireJobApplication,
);

// Rejects the applicant and stamps rejected_at
jobRouter.patch(
  '/employer/:id/applications/:applicationId/reject',
  authenticate([ROLES.EMPLOYER]),
  rejectJobApplication,
);

// --- Worker Applications ---
// Lists all applications created by the current worker
jobRouter.get('/applications/me', authenticate([ROLES.USER]), getMyJobApplications);

// Returns one application created by the current worker
jobRouter.get(
  '/applications/me/:applicationId',
  authenticate([ROLES.USER]),
  getMyJobApplicationById,
);

// Updates candidate-controlled fields such as cover_letter while the application is editable
jobRouter.patch(
  '/applications/me/:applicationId',
  authenticate([ROLES.USER]),
  updateMyJobApplication,
);

// Withdraws an application and stamps withdrawn_at
jobRouter.patch(
  '/applications/me/:applicationId/withdraw',
  authenticate([ROLES.USER]),
  withdrawJobApplication,
);

// --- Admin Moderation ---
// Lists every job in the system for moderation and operations
jobRouter.get('/admin/jobs', authenticate([ROLES.ADMIN]), getAllJobsForAdmin);

// Lists every application in the system for moderation and operations
jobRouter.get('/admin/applications', authenticate([ROLES.ADMIN]), getAllJobApplicationsForAdmin);

// Admin override for JobStatus
jobRouter.patch('/admin/jobs/:id/status', authenticate([ROLES.ADMIN]), adminUpdateJobStatus);

// Admin override for JobApplicationStatus
jobRouter.patch(
  '/admin/applications/:applicationId/status',
  authenticate([ROLES.ADMIN]),
  adminUpdateJobApplicationStatus,
);

// Creates an application for the current worker on a job
jobRouter.post('/:id/apply', authenticate([ROLES.USER]), applyForJob);

// Returns complete public job details, including employer and application summary when allowed
jobRouter.get('/:id', authenticate([ROLES.USER, ROLES.EMPLOYER, ROLES.ADMIN]), getJobById);

export default jobRouter;
