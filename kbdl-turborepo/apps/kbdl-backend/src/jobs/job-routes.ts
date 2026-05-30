import { Router } from 'express';
import { authenticate } from '../middleware/auth-middleware';
import { ROLES } from '../utils/constants';
import {
  createJob,
  getEmployerJobs,
  getJobApplications,
  updateApplicationStatus,
  updateJobStatus,
} from './job-controller';

const jobRouter: Router = Router();

// --- Job Queries & Mutations ---

// GET /api/jobs?status=open
// Retrieves all jobs posted by the authenticated employer
jobRouter.get('/', authenticate([ROLES.EMPLOYER]), getEmployerJobs);

// POST /api/jobs
// Validates salary, seats, and dates, then creates a new Job record
jobRouter.post('/', authenticate([ROLES.EMPLOYER]), createJob);

// PATCH /api/jobs/:id/status
// Updates the JobStatus enum (open, closed, paused)
jobRouter.patch('/:id/status', authenticate([ROLES.EMPLOYER]), updateJobStatus);

// --- Application Tracking Routes ---

// GET /api/jobs/:id/applications
// Fetches all JobApplication records associated with a specific job, including user profile data
jobRouter.get('/:id/applications', authenticate([ROLES.EMPLOYER]), getJobApplications);

// PATCH /api/jobs/applications/:applicationId/status
// Updates a candidate's JobApplicationStatus (applied, shortlisted, hired, rejected)
// Note: If changed to 'hired', the backend controller might also automatically increment the Job's 'seats_filled' count.
jobRouter.patch(
  '/applications/:applicationId/status',
  authenticate([ROLES.EMPLOYER]),
  updateApplicationStatus,
);

export default jobRouter;
