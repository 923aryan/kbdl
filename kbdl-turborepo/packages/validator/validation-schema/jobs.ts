import { z } from 'zod';

const jobStatusValues = ['draft', 'open', 'paused', 'closed', 'expired'] as const;
const employmentTypeValues = [
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'internship',
  'freelance',
] as const;
const jobWorkTypeValues = ['onsite', 'remote', 'hybrid'] as const;
const salaryTypeValues = ['hourly', 'daily', 'weekly', 'monthly'] as const;
const jobApplicationStatusValues = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'selected',
  'hired',
  'rejected',
  'withdrawn',
] as const;

const uuidParam = (name: string) => z.string().uuid(`Invalid ${name} format`);

const optionalBooleanQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((val) => (val ? val === 'true' : undefined));

const paginationQuery = {
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, {
      message: 'Page must be at least 1',
    }),
};

const jobIdParamsSchema = z.object({
  id: uuidParam('job ID'),
});

const jobApplicationParamsSchema = z.object({
  id: uuidParam('job ID'),
  applicationId: uuidParam('job application ID'),
});

const applicationIdParamsSchema = z.object({
  applicationId: uuidParam('job application ID'),
});

const latitudeQuery = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, 'Latitude must be a number')
  .optional()
  .transform((val) => (val ? Number(val) : undefined))
  .refine((val) => val === undefined || (val >= -90 && val <= 90), {
    message: 'Latitude must be between -90 and 90',
  });

const longitudeQuery = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, 'Longitude must be a number')
  .optional()
  .transform((val) => (val ? Number(val) : undefined))
  .refine((val) => val === undefined || (val >= -180 && val <= 180), {
    message: 'Longitude must be between -180 and 180',
  });

const radiusQuery = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Radius must be a number')
  .optional()
  .transform((val) => (val ? Number(val) : undefined))
  .refine((val) => val === undefined || (val > 0 && val <= 200), {
    message: 'Radius must be greater than 0 and at most 200',
  });

const optionalDecimalBody = (fieldName: string) =>
  z
    .number({ message: `${fieldName} must be a number` })
    .nonnegative(`${fieldName} cannot be negative`)
    .max(99999999.99, `${fieldName} is too large`)
    .optional();

const optionalIsoDateTimeBody = (fieldName: string) =>
  z.iso.datetime({ message: `${fieldName} must be a valid ISO datetime string` }).optional();

const jobBodyObjectSchema = z.object({
  title: z.string().trim().min(1, 'Job title cannot be empty').max(255, 'Job title is too long'),
  description: z.string().trim().min(1, 'Job description cannot be empty'),
  employment_type: z.enum(employmentTypeValues, {
    error: 'Invalid employment type provided',
  }),
  work_type: z.enum(jobWorkTypeValues, {
    error: 'Invalid job work type provided',
  }),
  salary_min: optionalDecimalBody('Minimum salary'),
  salary_max: optionalDecimalBody('Maximum salary'),
  salary_type: z.enum(salaryTypeValues, {
    error: 'Invalid salary type provided',
  }),
  is_negotiable: z.boolean().optional().default(false),
  job_start_time: optionalIsoDateTimeBody('Job start time'),
  job_end_time: optionalIsoDateTimeBody('Job end time'),
  address: z.string().trim().min(1, 'Address cannot be empty').optional(),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90).optional(),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180).optional(),
  seats_available: z
    .number({ message: 'Seats available must be a number' })
    .int('Seats available must be an integer')
    .positive('Seats available must be greater than 0')
    .optional(),
  status: z.enum(jobStatusValues, { error: 'Invalid job status provided' }).optional(),
  expires_at: optionalIsoDateTimeBody('Expiry time'),
});

const jobBodyBaseSchema = jobBodyObjectSchema
  .refine(
    (data) => {
      if (data.salary_min !== undefined && data.salary_max !== undefined) {
        return data.salary_max >= data.salary_min;
      }
      return true;
    },
    {
      message: 'Maximum salary must be greater than or equal to minimum salary',
      path: ['salary_max'],
    },
  )
  .refine(
    (data) => {
      if (data.job_start_time && data.job_end_time) {
        return new Date(data.job_end_time).getTime() > new Date(data.job_start_time).getTime();
      }
      return true;
    },
    {
      message: 'Job end time must be strictly after job start time',
      path: ['job_end_time'],
    },
  )
  .refine((data) => (data.latitude === undefined) === (data.longitude === undefined), {
    message: 'Latitude and longitude must be provided together',
    path: ['longitude'],
  });

const jobUpdateBodySchema = jobBodyObjectSchema
  .partial()
  .refine(
    (data) => {
      if (data.salary_min !== undefined && data.salary_max !== undefined) {
        return data.salary_max >= data.salary_min;
      }
      return true;
    },
    {
      message: 'Maximum salary must be greater than or equal to minimum salary',
      path: ['salary_max'],
    },
  )
  .refine(
    (data) => {
      if (data.job_start_time && data.job_end_time) {
        return new Date(data.job_end_time).getTime() > new Date(data.job_start_time).getTime();
      }
      return true;
    },
    {
      message: 'Job end time must be strictly after job start time',
      path: ['job_end_time'],
    },
  )
  .refine((data) => (data.latitude === undefined) === (data.longitude === undefined), {
    message: 'Latitude and longitude must be provided together',
    path: ['longitude'],
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one job field must be provided for update',
  });

const jobFiltersQuerySchema = z.object({
  ...paginationQuery,
  status: z.enum(jobStatusValues).optional(),
  employment_type: z.enum(employmentTypeValues).optional(),
  work_type: z.enum(jobWorkTypeValues).optional(),
  salary_type: z.enum(salaryTypeValues).optional(),
  is_negotiable: optionalBooleanQuery,
  search: z.string().trim().min(1, 'Search cannot be empty').optional(),
  employer_id: z.string().uuid('Invalid employer ID format').optional(),
  user_id: z.string().uuid('Invalid user ID format').optional(),
  salary_min: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Minimum salary must be a number')
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  salary_max: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Maximum salary must be a number')
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  starts_after: z.iso
    .datetime({ message: 'starts_after must be a valid ISO datetime string' })
    .optional(),
  starts_before: z.iso
    .datetime({ message: 'starts_before must be a valid ISO datetime string' })
    .optional(),
  expires_after: z.iso
    .datetime({ message: 'expires_after must be a valid ISO datetime string' })
    .optional(),
  expires_before: z.iso
    .datetime({ message: 'expires_before must be a valid ISO datetime string' })
    .optional(),
  latitude: latitudeQuery,
  longitude: longitudeQuery,
  radius: radiusQuery,
});

const applicationFiltersQuerySchema = z.object({
  ...paginationQuery,
  status: z.enum(jobApplicationStatusValues).optional(),
  user_id: z.string().uuid('Invalid user ID format').optional(),
  job_id: z.string().uuid('Invalid job ID format').optional(),
  applied_after: z.iso
    .datetime({ message: 'applied_after must be a valid ISO datetime string' })
    .optional(),
  applied_before: z.iso
    .datetime({ message: 'applied_before must be a valid ISO datetime string' })
    .optional(),
});

const jobStatusBodySchema = z.object({
  status: z.enum(jobStatusValues, {
    error: 'Invalid job status provided',
  }),
});

const applicationStatusBodySchema = z.object({
  status: z.enum(jobApplicationStatusValues, {
    error: 'Invalid job application status provided',
  }),
  employer_notes: z.string().trim().max(5000, 'Employer notes are too long').optional(),
  interview_at: optionalIsoDateTimeBody('Interview time'),
});

const coverLetterBodySchema = z.object({
  cover_letter: z.string().trim().max(5000, 'Cover letter is too long').optional(),
});

const employerNotesBodySchema = z.object({
  employer_notes: z
    .string()
    .trim()
    .min(1, 'Employer notes cannot be empty')
    .max(5000, 'Employer notes are too long'),
});

export const createJobSchema = z.object({
  body: jobBodyBaseSchema,
});

export const getJobsSchema = z.object({
  query: jobFiltersQuerySchema,
});

export const getLatestJobsSchema = z.object({
  query: z.object({
    ...paginationQuery,
  }),
});

export const getRecommendedJobsSchema = z.object({
  query: z.object({
    ...paginationQuery,
    latitude: latitudeQuery,
    longitude: longitudeQuery,
    radius: radiusQuery,
  }),
});

export const getJobByIdSchema = z.object({
  params: jobIdParamsSchema,
});

export const applyForJobSchema = z.object({
  params: jobIdParamsSchema,
  body: coverLetterBodySchema,
});

export const getEmployerJobsSchema = z.object({
  query: jobFiltersQuerySchema.omit({ employer_id: true, user_id: true }),
});

export const getEmployerJobByIdSchema = z.object({
  params: jobIdParamsSchema,
});

export const updateJobSchema = z.object({
  params: jobIdParamsSchema,
  body: jobUpdateBodySchema,
});

export const deleteJobSchema = z.object({
  params: jobIdParamsSchema,
});

export const duplicateJobSchema = z.object({
  params: jobIdParamsSchema,
});

export const updateJobStatusSchema = z.object({
  params: jobIdParamsSchema,
  body: jobStatusBodySchema,
});

export const publishJobSchema = z.object({
  params: jobIdParamsSchema,
});

export const pauseJobSchema = z.object({
  params: jobIdParamsSchema,
});

export const closeJobSchema = z.object({
  params: jobIdParamsSchema,
});

export const expireJobSchema = z.object({
  params: jobIdParamsSchema,
});

export const getJobApplicationsSchema = z.object({
  params: jobIdParamsSchema,
  query: applicationFiltersQuerySchema.omit({ job_id: true }),
});

export const getJobApplicationByIdSchema = z.object({
  params: jobApplicationParamsSchema,
});

export const updateJobApplicationStatusSchema = z.object({
  params: jobApplicationParamsSchema,
  body: applicationStatusBodySchema,
});

export const updateJobApplicationNotesSchema = z.object({
  params: jobApplicationParamsSchema,
  body: employerNotesBodySchema,
});

export const markJobApplicationUnderReviewSchema = z.object({
  params: jobApplicationParamsSchema,
  body: employerNotesBodySchema.partial().optional().default({}),
});

export const shortlistJobApplicationSchema = z.object({
  params: jobApplicationParamsSchema,
  body: employerNotesBodySchema.partial().optional().default({}),
});

export const scheduleJobApplicationInterviewSchema = z.object({
  params: jobApplicationParamsSchema,
  body: z.object({
    interview_at: z.iso.datetime({ message: 'Interview time must be a valid ISO datetime string' }),
    employer_notes: z.string().trim().max(5000, 'Employer notes are too long').optional(),
  }),
});

export const selectJobApplicationSchema = z.object({
  params: jobApplicationParamsSchema,
  body: employerNotesBodySchema.partial().optional().default({}),
});

export const hireJobApplicationSchema = z.object({
  params: jobApplicationParamsSchema,
  body: employerNotesBodySchema.partial().optional().default({}),
});

export const rejectJobApplicationSchema = z.object({
  params: jobApplicationParamsSchema,
  body: employerNotesBodySchema.partial().optional().default({}),
});

export const getMyJobApplicationsSchema = z.object({
  query: applicationFiltersQuerySchema.omit({ user_id: true }),
});

export const getMyJobApplicationByIdSchema = z.object({
  params: applicationIdParamsSchema,
});

export const updateMyJobApplicationSchema = z.object({
  params: applicationIdParamsSchema,
  body: coverLetterBodySchema.refine((data) => data.cover_letter !== undefined, {
    message: 'Cover letter must be provided for update',
  }),
});

export const withdrawJobApplicationSchema = z.object({
  params: applicationIdParamsSchema,
});

export const getAllJobsForAdminSchema = z.object({
  query: jobFiltersQuerySchema,
});

export const getAllJobApplicationsForAdminSchema = z.object({
  query: applicationFiltersQuerySchema,
});

export const adminUpdateJobStatusSchema = z.object({
  params: jobIdParamsSchema,
  body: jobStatusBodySchema,
});

export const adminUpdateJobApplicationStatusSchema = z.object({
  params: applicationIdParamsSchema,
  body: applicationStatusBodySchema,
});
