import { Prisma, prisma, safeUserSelect } from '@repo/db/server';
import {
  AdminUpdateJobApplicationStatusPayload,
  AdminUpdateJobApplicationStatusResponse,
  AdminUpdateJobStatusPayload,
  AdminUpdateJobStatusResponse,
  ApplyForJobPayload,
  ApplyForJobResponse,
  CloseJobResponse,
  CreateJobPayload,
  CreateJobResponse,
  DeleteJobResponse,
  DuplicateJobResponse,
  ExpireJobResponse,
  GetAllJobApplicationsForAdminQuery,
  GetAllJobApplicationsForAdminResponse,
  GetAllJobsForAdminQuery,
  GetAllJobsForAdminResponse,
  GetEmployerJobByIdResponse,
  GetEmployerJobsQuery,
  GetEmployerJobsResponse,
  GetJobApplicationByIdResponse,
  GetJobApplicationsQuery,
  GetJobApplicationsResponse,
  GetJobByIdResponse,
  GetJobsQuery,
  GetJobsResponse,
  GetLatestJobsQuery,
  GetLatestJobsResponse,
  GetMyJobApplicationByIdResponse,
  GetMyJobApplicationsQuery,
  GetMyJobApplicationsResponse,
  GetRecommendedJobsQuery,
  GetRecommendedJobsResponse,
  HireJobApplicationPayload,
  HireJobApplicationResponse,
  MarkJobApplicationUnderReviewPayload,
  MarkJobApplicationUnderReviewResponse,
  PauseJobResponse,
  PublishJobResponse,
  RejectJobApplicationPayload,
  RejectJobApplicationResponse,
  ScheduleJobApplicationInterviewPayload,
  ScheduleJobApplicationInterviewResponse,
  SelectJobApplicationPayload,
  SelectJobApplicationResponse,
  ShortlistJobApplicationPayload,
  ShortlistJobApplicationResponse,
  UpdateJobApplicationNotesPayload,
  UpdateJobApplicationNotesResponse,
  UpdateJobApplicationStatusPayload,
  UpdateJobApplicationStatusResponse,
  UpdateJobPayload,
  UpdateJobResponse,
  UpdateJobStatusPayload,
  UpdateJobStatusResponse,
  UpdateMyJobApplicationPayload,
  UpdateMyJobApplicationResponse,
  WithdrawJobApplicationResponse,
} from '@repo/types';
import {
  companyAsEmployerInclude,
  toEmployerDtoFromIncludedCompany,
} from '../compat/employer-compat';
import { createNotificationService } from '../notifications/notification-service';
import { AppError } from '../utils/api-error';
import {
  JobApplicationStatus,
  JobStatus,
  type JobStatus as JobStatusValue,
  NotificationTypes,
} from '../utils/constants';

type PaginatedResult<T> = {
  meta: Record<string, number>;
} & T;

type JobQueryWithLocation = {
  latitude?: number;
  longitude?: number;
  radius?: number;
};

const jobInclude = {
  company: companyAsEmployerInclude,
} as const;

const jobDetailsInclude = {
  ...jobInclude,
  applications: true,
} as const;

const mapJobToApi = <T extends { company_id: string; company?: any }>(job: T) => {
  const { company, ...rest } = job as T & { company?: any };
  return {
    ...rest,
    employer_id: job.company_id,
    employer: toEmployerDtoFromIncludedCompany(company),
    user: null,
  };
};

const mapJobApplicationToApi = <T extends { job?: any }>(application: T) => {
  if (!application.job) return application;
  return {
    ...application,
    job: mapJobToApi(application.job),
  };
};

const notImplemented = async <T>(serviceName: string): Promise<T> => {
  throw new AppError(501, 'NOT_IMPLEMENTED', `${serviceName} service is not implemented yet.`);
};

const getPaginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const assertLocationQuery = (query: JobQueryWithLocation) => {
  const hasLatitude = query.latitude !== undefined;
  const hasLongitude = query.longitude !== undefined;

  if (hasLatitude !== hasLongitude) {
    throw new AppError(
      400,
      'INVALID_LOCATION_FILTER',
      'Latitude and longitude must be provided together.',
    );
  }

  if (query.radius !== undefined && (!hasLatitude || !hasLongitude)) {
    throw new AppError(
      400,
      'INVALID_LOCATION_FILTER',
      'Radius can only be used with latitude and longitude.',
    );
  }
};

const getNearbyJobIds = async (
  latitude: number,
  longitude: number,
  radiusInKm = 10,
): Promise<string[]> => {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `
      SELECT id
      FROM jobs
      WHERE location IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
    `,
    longitude,
    latitude,
    radiusInKm * 1000,
  );

  return rows.map((row) => row.id);
};

const getUserLocation = async (
  userId: string,
): Promise<{ latitude: number; longitude: number } | null> => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ latitude: number | null; longitude: number | null }>
  >(
    `
      SELECT
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude
      FROM users
      WHERE id = $1::uuid
    `,
    userId,
  );

  const user = rows[0];
  if (!user || user.latitude === null || user.longitude === null) {
    return null;
  }

  return {
    latitude: Number(user.latitude),
    longitude: Number(user.longitude),
  };
};

const setJobLocation = async (jobId: string, latitude: number, longitude: number) => {
  await prisma.$executeRaw`
    UPDATE jobs
    SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
    WHERE id = ${jobId}::uuid
  `;
};

const copyJobLocation = async (sourceJobId: string, targetJobId: string) => {
  await prisma.$executeRaw`
    UPDATE jobs target
    SET location = source.location
    FROM jobs source
    WHERE target.id = ${targetJobId}::uuid
      AND source.id = ${sourceJobId}::uuid
  `;
};

const assertJobTimeline = ({
  job_start_time,
  job_end_time,
  expires_at,
}: {
  job_start_time?: string | Date | null;
  job_end_time?: string | Date | null;
  expires_at?: string | Date | null;
}) => {
  const now = Date.now();
  const start = job_start_time ? new Date(job_start_time).getTime() : undefined;
  const end = job_end_time ? new Date(job_end_time).getTime() : undefined;
  const expires = expires_at ? new Date(expires_at).getTime() : undefined;

  if (start !== undefined && start < now) {
    throw new AppError(400, 'INVALID_JOB_START_TIME', 'Job start time cannot be in the past.');
  }

  if (end !== undefined && end < now) {
    throw new AppError(400, 'INVALID_JOB_END_TIME', 'Job end time cannot be in the past.');
  }

  if (start !== undefined && end !== undefined && end <= start) {
    throw new AppError(
      400,
      'INVALID_JOB_SCHEDULE',
      'Job end time must be strictly after job start time.',
    );
  }

  if (expires !== undefined && expires <= now) {
    throw new AppError(400, 'INVALID_EXPIRY_TIME', 'Job expiry time must be in the future.');
  }
};

const assertSalaryRange = (salaryMin?: unknown, salaryMax?: unknown) => {
  if (
    salaryMin !== undefined &&
    salaryMax !== undefined &&
    salaryMin !== null &&
    salaryMax !== null
  ) {
    if (Number(salaryMax) < Number(salaryMin)) {
      throw new AppError(
        400,
        'INVALID_SALARY_RANGE',
        'Maximum salary must be greater than or equal to minimum salary.',
      );
    }
  }
};

const assertPublishableJob = (job: {
  title: string;
  description: string;
  expires_at: Date | null;
}) => {
  if (!job.title.trim() || !job.description.trim()) {
    throw new AppError(
      400,
      'JOB_NOT_PUBLISHABLE',
      'Job must have title and description before it can be published.',
    );
  }

  if (job.expires_at && job.expires_at.getTime() <= Date.now()) {
    throw new AppError(400, 'JOB_EXPIRED', 'Expired jobs cannot be published.');
  }
};

const assertOpenForApplications = async (jobId: string) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found.');
  }

  if (job.status !== JobStatus.open) {
    throw new AppError(400, 'JOB_NOT_OPEN', 'This job is not accepting applications.');
  }

  if (job.expires_at && job.expires_at.getTime() <= Date.now()) {
    throw new AppError(400, 'JOB_EXPIRED', 'This job has expired.');
  }

  if (job.seats_available !== null) {
    const hiredCount = await prisma.jobApplication.count({
      where: {
        job_id: jobId,
        status: JobApplicationStatus.hired,
      },
    });

    if (hiredCount >= job.seats_available) {
      throw new AppError(400, 'NO_SEATS_AVAILABLE', 'No seats are available for this job.');
    }
  }

  return job;
};

const getOwnedJob = async (employerId: string, jobId: string) => {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      company_id: employerId,
    },
  });

  if (!job) {
    throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found or access denied.');
  }

  return job;
};

const buildJobWhereClause = async (
  query: GetJobsQuery | GetEmployerJobsQuery | GetAllJobsForAdminQuery,
  options: { employerId?: string; defaultOpenOnly?: boolean } = {},
): Promise<Prisma.JobWhereInput> => {
  assertLocationQuery(query);

  const where: Prisma.JobWhereInput = {};
  const now = new Date();

  if (options.employerId) {
    where.company_id = options.employerId;
  }

  if (query.status) {
    where.status = query.status;
  } else if (options.defaultOpenOnly) {
    where.status = JobStatus.open;
  }

  if (where.status === JobStatus.open) {
    where.OR = [{ expires_at: null }, { expires_at: { gt: now } }];
  }

  if (query.employment_type) {
    where.employment_type = query.employment_type;
  }

  if (query.work_type) {
    where.work_type = query.work_type;
  }

  if (query.salary_type) {
    where.salary_type = query.salary_type;
  }

  if (query.is_negotiable !== undefined) {
    where.is_negotiable = query.is_negotiable;
  }

  if ('employer_id' in query && query.employer_id) {
    where.company_id = query.employer_id;
  }

  if (query.salary_min !== undefined) {
    where.salary_max = { gte: query.salary_min };
  }

  if (query.salary_max !== undefined) {
    where.salary_min = { lte: query.salary_max };
  }

  if (query.starts_after || query.starts_before) {
    where.job_start_time = {
      ...(query.starts_after && { gte: new Date(query.starts_after) }),
      ...(query.starts_before && { lte: new Date(query.starts_before) }),
    };
  }

  if (query.expires_after || query.expires_before) {
    where.expires_at = {
      ...(query.expires_after && { gte: new Date(query.expires_after) }),
      ...(query.expires_before && { lte: new Date(query.expires_before) }),
    };
  }

  if (query.search) {
    const searchWhere: Prisma.JobWhereInput = {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { company: { company_name: { contains: query.search, mode: 'insensitive' } } },
      ],
    };

    where.AND = [...(Array.isArray(where.AND) ? where.AND : []), searchWhere];
  }

  if (query.latitude !== undefined && query.longitude !== undefined) {
    const nearbyIds = await getNearbyJobIds(query.latitude, query.longitude, query.radius);

    if (nearbyIds.length === 0) {
      where.id = { in: [] };
    } else {
      where.id = { in: nearbyIds };
    }
  }

  return where;
};

const getPaginatedJobs = async (
  where: Prisma.JobWhereInput,
  limit: number,
  page: number,
  orderBy: Prisma.JobOrderByWithRelationInput = { created_at: 'desc' },
) => {
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: jobInclude,
      orderBy,
      take: limit,
      skip,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs: jobs.map(mapJobToApi),
    meta: getPaginationMeta(total, page, limit),
  };
};

const getJobCreateData = (
  employerId: string,
  payload: CreateJobPayload,
): Prisma.JobUncheckedCreateInput => ({
  company_id: employerId,
  title: payload.title,
  description: payload.description,
  employment_type: payload.employment_type,
  work_type: payload.work_type,
  salary_min: payload.salary_min,
  salary_max: payload.salary_max,
  salary_type: payload.salary_type,
  is_negotiable: payload.is_negotiable,
  job_start_time: payload.job_start_time ? new Date(payload.job_start_time) : undefined,
  job_end_time: payload.job_end_time ? new Date(payload.job_end_time) : undefined,
  address: payload.address,
  seats_available: payload.seats_available,
  status: payload.status ?? JobStatus.open,
  expires_at: payload.expires_at ? new Date(payload.expires_at) : undefined,
});

const getJobUpdateData = (payload: UpdateJobPayload): Prisma.JobUncheckedUpdateInput => {
  const data: Prisma.JobUncheckedUpdateInput = {};

  if (payload.title !== undefined) data.title = payload.title;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.employment_type !== undefined) data.employment_type = payload.employment_type;
  if (payload.work_type !== undefined) data.work_type = payload.work_type;
  if (payload.salary_min !== undefined) data.salary_min = payload.salary_min;
  if (payload.salary_max !== undefined) data.salary_max = payload.salary_max;
  if (payload.salary_type !== undefined) data.salary_type = payload.salary_type;
  if (payload.is_negotiable !== undefined) data.is_negotiable = payload.is_negotiable;
  if (payload.job_start_time !== undefined) data.job_start_time = new Date(payload.job_start_time);
  if (payload.job_end_time !== undefined) data.job_end_time = new Date(payload.job_end_time);
  if (payload.address !== undefined) data.address = payload.address;
  if (payload.seats_available !== undefined) data.seats_available = payload.seats_available;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.expires_at !== undefined) data.expires_at = new Date(payload.expires_at);

  return data;
};

const updateOwnedJobStatus = async (employerId: string, jobId: string, status: JobStatusValue) => {
  const job = await getOwnedJob(employerId, jobId);

  if (job.status === status) {
    return job;
  }

  if (job.status === JobStatus.expired) {
    throw new AppError(400, 'JOB_EXPIRED', 'Expired jobs cannot be changed.');
  }

  if (job.status === JobStatus.closed && status !== JobStatus.closed) {
    throw new AppError(400, 'JOB_CLOSED', 'Closed jobs cannot be reopened.');
  }

  if (status === JobStatus.open) {
    assertPublishableJob(job);
  }

  if (status === JobStatus.paused && job.status !== JobStatus.open) {
    throw new AppError(400, 'INVALID_JOB_STATUS', 'Only open jobs can be paused.');
  }

  if (
    status === JobStatus.closed &&
    job.status !== JobStatus.open &&
    job.status !== JobStatus.paused
  ) {
    throw new AppError(400, 'INVALID_JOB_STATUS', 'Only open or paused jobs can be closed.');
  }

  return prisma.job.update({
    where: { id: jobId },
    data: { status },
  }).then((job) => ({ ...job, employer_id: job.company_id })) as any;
};

export const getJobsService = async (
  query: GetJobsQuery,
): Promise<PaginatedResult<{ jobs: GetJobsResponse }>> => {
  const { limit = 10, page = 1 } = query;
  const where = await buildJobWhereClause(query, { defaultOpenOnly: true });

  return getPaginatedJobs(where, limit, page);
};

export const getLatestJobsService = async (
  query: GetLatestJobsQuery,
): Promise<PaginatedResult<{ jobs: GetLatestJobsResponse }>> => {
  const { limit = 10, page = 1 } = query;

  return getPaginatedJobs(
    {
      status: JobStatus.open,
      OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    },
    limit,
    page,
    { created_at: 'desc' },
  );
};

export const getRecommendedJobsService = async (
  userId: string,
  query: GetRecommendedJobsQuery,
): Promise<PaginatedResult<{ jobs: GetRecommendedJobsResponse }>> => {
  assertLocationQuery(query);

  const { limit = 10, page = 1 } = query;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      skills: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
  }

  const where: Prisma.JobWhereInput = {
    status: JobStatus.open,
    OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
    applications: {
      none: {
        user_id: userId,
        status: {
          not: JobApplicationStatus.withdrawn,
        },
      },
    },
    // Exclude jobs for companies the user belongs to
    NOT: {
      company: {
        members: {
          some: { user_id: userId },
        },
      },
    },
  };

  if (user.skills.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: user.skills.flatMap((skill) => [
          { title: { contains: skill, mode: 'insensitive' } },
          { description: { contains: skill, mode: 'insensitive' } },
        ]),
      },
    ];
  }

  const location =
    query.latitude !== undefined && query.longitude !== undefined
      ? { latitude: query.latitude, longitude: query.longitude }
      : await getUserLocation(userId);

  if (location) {
    const nearbyIds = await getNearbyJobIds(location.latitude, location.longitude, query.radius);
    where.id = { in: nearbyIds };
  }

  return getPaginatedJobs(where, limit, page, { created_at: 'desc' });
};

export const getJobByIdService = async (jobId: string): Promise<GetJobByIdResponse> => {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      status: {
        not: JobStatus.draft,
      },
    },
    include: jobInclude,
  });

  if (!job) {
    throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found.');
  }

  return mapJobToApi(job) as GetJobByIdResponse;
};

export const applyForJobService = async (
  userId: string,
  jobId: string,
  payload: ApplyForJobPayload,
): Promise<ApplyForJobResponse> => {
  const job = await assertOpenForApplications(jobId);

  const companyMember = await prisma.companyMember.findFirst({
    where: {
      user_id: userId,
      company_id: job.company_id,
    },
  });

  if (companyMember) {
    throw new AppError(400, 'CANNOT_APPLY_TO_OWN_JOB', 'You cannot apply to your own job.');
  }

  const existingApplication = await prisma.jobApplication.findUnique({
    where: {
      job_id_user_id: {
        job_id: jobId,
        user_id: userId,
      },
    },
  });

  if (existingApplication && existingApplication.status !== JobApplicationStatus.withdrawn) {
    throw new AppError(409, 'ALREADY_APPLIED', 'You have already applied for this job.');
  }

  if (existingApplication) {
    return prisma.jobApplication.update({
      where: { id: existingApplication.id },
      data: {
        status: JobApplicationStatus.applied,
        cover_letter: payload.cover_letter,
        applied_at: new Date(),
        reviewed_at: null,
        shortlisted_at: null,
        interview_at: null,
        hired_at: null,
        rejected_at: null,
        withdrawn_at: null,
        employer_notes: null,
      },
    });
  }

  return prisma.jobApplication.create({
    data: {
      job_id: jobId,
      user_id: userId,
      cover_letter: payload.cover_letter,
      status: JobApplicationStatus.applied,
    },
  });
};

export const createJobService = async (
  employerId: string,
  payload: CreateJobPayload,
): Promise<CreateJobResponse> => {
  assertSalaryRange(payload.salary_min, payload.salary_max);
  assertJobTimeline(payload);

  if (payload.status && payload.status !== JobStatus.draft && payload.status !== JobStatus.open) {
    throw new AppError(
      400,
      'INVALID_INITIAL_JOB_STATUS',
      'Jobs can only be created as draft or open.',
    );
  }

  const employer = await prisma.company.findUnique({
    where: { id: employerId },
    select: { id: true },
  });

  if (!employer) {
    throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer not found.');
  }

  const job = await prisma.job.create({
    data: getJobCreateData(employerId, payload),
  });

  if (payload.latitude !== undefined && payload.longitude !== undefined) {
    await setJobLocation(job.id, payload.latitude, payload.longitude);
  }

  return { ...job, employer_id: job.company_id } as CreateJobResponse;
};

export const getEmployerJobsService = async (
  employerId: string,
  query: GetEmployerJobsQuery,
): Promise<PaginatedResult<{ jobs: GetEmployerJobsResponse }>> => {
  const { limit = 10, page = 1 } = query;
  const where = await buildJobWhereClause(query, { employerId });

  return getPaginatedJobs(where, limit, page);
};

export const getEmployerJobByIdService = async (
  employerId: string,
  jobId: string,
): Promise<GetEmployerJobByIdResponse> => {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      company_id: employerId,
    },
    include: jobDetailsInclude,
  });

  if (!job) {
    throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found or access denied.');
  }

  return mapJobToApi(job) as GetEmployerJobByIdResponse;
};

export const updateJobService = async (
  employerId: string,
  jobId: string,
  payload: UpdateJobPayload,
): Promise<UpdateJobResponse> => {
  const existingJob = await getOwnedJob(employerId, jobId);

  if (existingJob.status === JobStatus.closed || existingJob.status === JobStatus.expired) {
    throw new AppError(400, 'JOB_NOT_EDITABLE', 'Closed or expired jobs cannot be edited.');
  }

  const nextSalaryMin = payload.salary_min ?? existingJob.salary_min;
  const nextSalaryMax = payload.salary_max ?? existingJob.salary_max;
  assertSalaryRange(nextSalaryMin, nextSalaryMax);

  if (payload.job_start_time !== undefined || payload.job_end_time !== undefined) {
    assertJobTimeline({
      job_start_time: payload.job_start_time ?? existingJob.job_start_time,
      job_end_time: payload.job_end_time ?? existingJob.job_end_time,
    });
  }

  if (payload.expires_at !== undefined) {
    assertJobTimeline({
      expires_at: payload.expires_at,
    });
  }

  if (payload.status && payload.status !== existingJob.status) {
    await updateOwnedJobStatus(employerId, jobId, payload.status);
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: getJobUpdateData({ ...payload, status: undefined }),
  });

  if (payload.latitude !== undefined && payload.longitude !== undefined) {
    await setJobLocation(jobId, payload.latitude, payload.longitude);
  }

  return { ...updatedJob, employer_id: updatedJob.company_id } as any;
};

export const deleteJobService = async (
  employerId: string,
  jobId: string,
): Promise<DeleteJobResponse> => {
  const job = await getOwnedJob(employerId, jobId);

  if (job.status !== JobStatus.draft) {
    throw new AppError(400, 'JOB_NOT_DELETABLE', 'Only draft jobs can be deleted.');
  }

  const applicationsCount = await prisma.jobApplication.count({
    where: { job_id: jobId },
  });

  if (applicationsCount > 0) {
    throw new AppError(400, 'JOB_HAS_APPLICATIONS', 'Jobs with applications cannot be deleted.');
  }

  return prisma.job.delete({
    where: { id: jobId },
  }).then((job) => ({ ...job, employer_id: job.company_id })) as any;
};

export const duplicateJobService = async (
  employerId: string,
  jobId: string,
): Promise<DuplicateJobResponse> => {
  const sourceJob = await getOwnedJob(employerId, jobId);

  const duplicatedJob = await prisma.job.create({
    data: {
      company_id: employerId,
      title: `${sourceJob.title} (Copy)`,
      description: sourceJob.description,
      employment_type: sourceJob.employment_type,
      work_type: sourceJob.work_type,
      salary_min: sourceJob.salary_min,
      salary_max: sourceJob.salary_max,
      salary_type: sourceJob.salary_type,
      is_negotiable: sourceJob.is_negotiable,
      job_start_time: sourceJob.job_start_time,
      job_end_time: sourceJob.job_end_time,
      address: sourceJob.address,
      seats_available: sourceJob.seats_available,
      status: JobStatus.draft,
      expires_at: sourceJob.expires_at,
    },
  });

  await copyJobLocation(sourceJob.id, duplicatedJob.id);

  return { ...duplicatedJob, employer_id: duplicatedJob.company_id } as DuplicateJobResponse;
};

export const updateJobStatusService = async (
  employerId: string,
  jobId: string,
  payload: UpdateJobStatusPayload,
): Promise<UpdateJobStatusResponse> => updateOwnedJobStatus(employerId, jobId, payload.status);

export const publishJobService = async (
  employerId: string,
  jobId: string,
): Promise<PublishJobResponse> => updateOwnedJobStatus(employerId, jobId, JobStatus.open);

export const pauseJobService = async (
  employerId: string,
  jobId: string,
): Promise<PauseJobResponse> => updateOwnedJobStatus(employerId, jobId, JobStatus.paused);

export const closeJobService = async (
  employerId: string,
  jobId: string,
): Promise<CloseJobResponse> => updateOwnedJobStatus(employerId, jobId, JobStatus.closed);

export const expireJobService = async (
  employerId: string,
  jobId: string,
): Promise<ExpireJobResponse> => updateOwnedJobStatus(employerId, jobId, JobStatus.expired);

export const getJobApplicationsService = async (
  employerId: string,
  jobId: string,
  query: GetJobApplicationsQuery,
): Promise<PaginatedResult<{ applications: GetJobApplicationsResponse }>> => {
  await getOwnedJob(employerId, jobId);

  const { limit = 10, page = 1, status, applied_after, applied_before } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.JobApplicationWhereInput = {
    job_id: jobId,
  };

  if (status) {
    where.status = status;
  }

  if (query.user_id) {
    where.user_id = query.user_id;
  }

  if (applied_after || applied_before) {
    where.applied_at = {
      ...(applied_after && { gte: new Date(applied_after) }),
      ...(applied_before && { lte: new Date(applied_before) }),
    };
  }

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      include: {
        job: { include: jobInclude },
        user: { select: safeUserSelect },
      },
      orderBy: { applied_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.jobApplication.count({ where }),
  ]);

  return {
    applications: applications.map(mapJobApplicationToApi) as any,
    meta: getPaginationMeta(total, page, limit),
  };
};

export const getJobApplicationByIdService = async (
  employerId: string,
  jobId: string,
  applicationId: string,
): Promise<GetJobApplicationByIdResponse> => {
  await getOwnedJob(employerId, jobId);

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job_id: jobId,
    },
    include: {
      job: { include: jobInclude },
      user: { select: safeUserSelect },
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  return mapJobApplicationToApi(application) as any;
};

export const updateJobApplicationStatusService = async (
  employerId: string,
  jobId: string,
  applicationId: string,
  payload: UpdateJobApplicationStatusPayload,
): Promise<UpdateJobApplicationStatusResponse> => {
  await getOwnedJob(employerId, jobId);

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job_id: jobId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  const data: Prisma.JobApplicationUncheckedUpdateInput = {
    status: payload.status,
  };

  if (payload.employer_notes !== undefined) {
    data.employer_notes = payload.employer_notes;
  }

  // Update relevant timestamps based on status
  const now = new Date();
  if (payload.status === JobApplicationStatus.under_review) data.reviewed_at = now;
  else if (payload.status === JobApplicationStatus.shortlisted) data.shortlisted_at = now;
  else if (payload.status === JobApplicationStatus.interview_scheduled) {
    if (payload.interview_at) data.interview_at = new Date(payload.interview_at);
  } else if (payload.status === JobApplicationStatus.hired) data.hired_at = now;
  else if (payload.status === JobApplicationStatus.rejected) data.rejected_at = now;
  else if (payload.status === JobApplicationStatus.withdrawn) data.withdrawn_at = now;

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: applicationId },
    data,
  });

  await createNotificationService({
    userId: application.user_id,
    type: NotificationTypes.jobApplicationUpdate,
    title: 'Job Application Status Updated',
    body: `Your job application status has been updated to ${payload.status.replace('_', ' ')}.`,
    data: {
      type: NotificationTypes.jobApplicationUpdate,
      jobId,
      applicationId,
      status: payload.status,
    },
  });

  return updatedApplication;
};

export const updateJobApplicationNotesService = async (
  employerId: string,
  jobId: string,
  applicationId: string,
  payload: UpdateJobApplicationNotesPayload,
): Promise<UpdateJobApplicationNotesResponse> => {
  await getOwnedJob(employerId, jobId);

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job_id: jobId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      employer_notes: payload.employer_notes,
    },
  });
};

export const markJobApplicationUnderReviewService = async (
  employerId: string,
  jobId: string,
  applicationId: string,
  payload: MarkJobApplicationUnderReviewPayload,
): Promise<MarkJobApplicationUnderReviewResponse> => {
  await getOwnedJob(employerId, jobId);

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job_id: jobId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: JobApplicationStatus.under_review,
      reviewed_at: new Date(),
      ...(payload.employer_notes !== undefined && { employer_notes: payload.employer_notes }),
    },
  });

  await createNotificationService({
    userId: application.user_id,
    type: NotificationTypes.jobApplicationUpdate,
    title: 'Job Application Under Review',
    body: 'Your job application is now under review.',
    data: {
      type: NotificationTypes.jobApplicationUpdate,
      jobId,
      applicationId,
      status: JobApplicationStatus.under_review,
    },
  });

  return updatedApplication;
};

export const shortlistJobApplicationService = async (
  employerId: string,
  jobId: string,
  applicationId: string,
  payload: ShortlistJobApplicationPayload,
): Promise<ShortlistJobApplicationResponse> => {
  await getOwnedJob(employerId, jobId);

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job_id: jobId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: JobApplicationStatus.shortlisted,
      shortlisted_at: new Date(),
      ...(payload.employer_notes !== undefined && { employer_notes: payload.employer_notes }),
    },
  });

  await createNotificationService({
    userId: application.user_id,
    type: NotificationTypes.jobApplicationUpdate,
    title: 'Job Application Shortlisted',
    body: 'Your job application has been shortlisted.',
    data: {
      type: NotificationTypes.jobApplicationUpdate,
      jobId,
      applicationId,
      status: JobApplicationStatus.shortlisted,
    },
  });

  return updatedApplication;
};

export const scheduleJobApplicationInterviewService = async (
  employerId: string,
  jobId: string,
  applicationId: string,
  payload: ScheduleJobApplicationInterviewPayload,
): Promise<ScheduleJobApplicationInterviewResponse> => {
  await getOwnedJob(employerId, jobId);

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job_id: jobId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: JobApplicationStatus.interview_scheduled,
      interview_at: new Date(payload.interview_at),
      ...(payload.employer_notes !== undefined && { employer_notes: payload.employer_notes }),
    },
  });

  await createNotificationService({
    userId: application.user_id,
    type: NotificationTypes.jobApplicationUpdate,
    title: 'Interview Scheduled',
    body: 'An interview has been scheduled for your job application.',
    data: {
      type: NotificationTypes.jobApplicationUpdate,
      jobId,
      applicationId,
      status: JobApplicationStatus.interview_scheduled,
    },
  });

  return updatedApplication;
};

export const selectJobApplicationService = async (
  employerId: string,
  jobId: string,
  applicationId: string,
  payload: SelectJobApplicationPayload,
): Promise<SelectJobApplicationResponse> => {
  await getOwnedJob(employerId, jobId);

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job_id: jobId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: JobApplicationStatus.selected,
      ...(payload.employer_notes !== undefined && { employer_notes: payload.employer_notes }),
    },
  });

  await createNotificationService({
    userId: application.user_id,
    type: NotificationTypes.jobApplicationUpdate,
    title: 'Job Application Selected',
    body: 'You have been selected for the job.',
    data: {
      type: NotificationTypes.jobApplicationUpdate,
      jobId,
      applicationId,
      status: JobApplicationStatus.selected,
    },
  });

  return updatedApplication;
};

export const hireJobApplicationService = async (
  employerId: string,
  jobId: string,
  applicationId: string,
  payload: HireJobApplicationPayload,
): Promise<HireJobApplicationResponse> => {
  const job = await getOwnedJob(employerId, jobId);

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job_id: jobId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  if (job.seats_available !== null) {
    const hiredCount = await prisma.jobApplication.count({
      where: {
        job_id: jobId,
        status: JobApplicationStatus.hired,
      },
    });

    if (hiredCount >= job.seats_available) {
      throw new AppError(400, 'NO_SEATS_AVAILABLE', 'No seats are available for this job.');
    }
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: JobApplicationStatus.hired,
      hired_at: new Date(),
      ...(payload.employer_notes !== undefined && { employer_notes: payload.employer_notes }),
    },
  });

  await createNotificationService({
    userId: application.user_id,
    type: NotificationTypes.jobApplicationUpdate,
    title: 'You are Hired!',
    body: 'Congratulations, you have been hired for the job.',
    data: {
      type: NotificationTypes.jobApplicationUpdate,
      jobId,
      applicationId,
      status: JobApplicationStatus.hired,
    },
  });

  return updatedApplication;
};

export const rejectJobApplicationService = async (
  employerId: string,
  jobId: string,
  applicationId: string,
  payload: RejectJobApplicationPayload,
): Promise<RejectJobApplicationResponse> => {
  await getOwnedJob(employerId, jobId);

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job_id: jobId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: JobApplicationStatus.rejected,
      rejected_at: new Date(),
      ...(payload.employer_notes !== undefined && { employer_notes: payload.employer_notes }),
    },
  });

  await createNotificationService({
    userId: application.user_id,
    type: NotificationTypes.jobApplicationUpdate,
    title: 'Job Application Update',
    body: 'Unfortunately, your job application has been rejected.',
    data: {
      type: NotificationTypes.jobApplicationUpdate,
      jobId,
      applicationId,
      status: JobApplicationStatus.rejected,
    },
  });

  return updatedApplication;
};

export const getMyJobApplicationsService = async (
  userId: string,
  query: GetMyJobApplicationsQuery,
): Promise<PaginatedResult<{ applications: GetMyJobApplicationsResponse }>> => {
  const { limit = 10, page = 1, status, applied_after, applied_before } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.JobApplicationWhereInput = {
    user_id: userId,
  };

  if (status) {
    where.status = status;
  }

  if (applied_after || applied_before) {
    where.applied_at = {
      ...(applied_after && { gte: new Date(applied_after) }),
      ...(applied_before && { lte: new Date(applied_before) }),
    };
  }

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      include: {
        job: { include: jobInclude },
        user: { select: safeUserSelect },
      },
      orderBy: { applied_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.jobApplication.count({ where }),
  ]);

  return {
    applications: applications.map(mapJobApplicationToApi) as any,
    meta: getPaginationMeta(total, page, limit),
  };
};

export const getMyJobApplicationByIdService = async (
  userId: string,
  applicationId: string,
): Promise<GetMyJobApplicationByIdResponse> => {
  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      user_id: userId,
    },
    include: {
      job: { include: jobInclude },
      user: { select: safeUserSelect },
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  return mapJobApplicationToApi(application) as any;
};

export const updateMyJobApplicationService = async (
  userId: string,
  applicationId: string,
  payload: UpdateMyJobApplicationPayload,
): Promise<UpdateMyJobApplicationResponse> => {
  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      user_id: userId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  if (
    application.status === JobApplicationStatus.withdrawn ||
    application.status === JobApplicationStatus.rejected ||
    application.status === JobApplicationStatus.hired
  ) {
    throw new AppError(
      400,
      'APPLICATION_NOT_EDITABLE',
      'This application can no longer be edited.',
    );
  }

  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      cover_letter: payload.cover_letter,
    },
  });
};

export const withdrawJobApplicationService = async (
  userId: string,
  applicationId: string,
): Promise<WithdrawJobApplicationResponse> => {
  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      user_id: userId,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  if (application.status === JobApplicationStatus.withdrawn) {
    throw new AppError(400, 'ALREADY_WITHDRAWN', 'Application is already withdrawn.');
  }

  if (
    application.status === JobApplicationStatus.hired ||
    application.status === JobApplicationStatus.rejected
  ) {
    throw new AppError(400, 'CANNOT_WITHDRAW', 'Cannot withdraw a finalized application.');
  }

  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status: JobApplicationStatus.withdrawn,
      withdrawn_at: new Date(),
    },
  });
};

export const getAllJobsForAdminService = async (
  query: GetAllJobsForAdminQuery,
): Promise<PaginatedResult<{ jobs: GetAllJobsForAdminResponse }>> => {
  const { limit = 10, page = 1 } = query;
  const where = await buildJobWhereClause(query);
  return getPaginatedJobs(where, limit, page);
};

export const getAllJobApplicationsForAdminService = async (
  query: GetAllJobApplicationsForAdminQuery,
): Promise<PaginatedResult<{ applications: GetAllJobApplicationsForAdminResponse }>> => {
  const { limit = 10, page = 1, status, applied_after, applied_before, job_id, user_id } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.JobApplicationWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (job_id) {
    where.job_id = job_id;
  }

  if (user_id) {
    where.user_id = user_id;
  }

  if (applied_after || applied_before) {
    where.applied_at = {
      ...(applied_after && { gte: new Date(applied_after) }),
      ...(applied_before && { lte: new Date(applied_before) }),
    };
  }

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      include: {
        job: { include: jobInclude },
        user: { select: safeUserSelect },
      },
      orderBy: { applied_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.jobApplication.count({ where }),
  ]);

  return {
    applications: applications.map(mapJobApplicationToApi) as any,
    meta: getPaginationMeta(total, page, limit),
  };
};

export const adminUpdateJobStatusService = async (
  jobId: string,
  payload: AdminUpdateJobStatusPayload,
): Promise<AdminUpdateJobStatusResponse> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new AppError(404, 'JOB_NOT_FOUND', 'Job not found.');
  }

  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: payload.status,
    },
  }).then((job) => ({ ...job, employer_id: job.company_id })) as any;
};

export const adminUpdateJobApplicationStatusService = async (
  applicationId: string,
  payload: AdminUpdateJobApplicationStatusPayload,
): Promise<AdminUpdateJobApplicationStatusResponse> => {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Job application not found.');
  }

  const data: Prisma.JobApplicationUncheckedUpdateInput = {
    status: payload.status,
  };

  if (payload.employer_notes !== undefined) {
    data.employer_notes = payload.employer_notes;
  }

  const now = new Date();
  if (payload.status === JobApplicationStatus.under_review) data.reviewed_at = now;
  else if (payload.status === JobApplicationStatus.shortlisted) data.shortlisted_at = now;
  else if (payload.status === JobApplicationStatus.interview_scheduled) {
    if (payload.interview_at) data.interview_at = new Date(payload.interview_at);
  } else if (payload.status === JobApplicationStatus.hired) data.hired_at = now;
  else if (payload.status === JobApplicationStatus.rejected) data.rejected_at = now;
  else if (payload.status === JobApplicationStatus.withdrawn) data.withdrawn_at = now;

  const updatedApplication = await prisma.jobApplication.update({
    where: { id: applicationId },
    data,
  });

  await createNotificationService({
    userId: application.user_id,
    type: NotificationTypes.jobApplicationUpdate,
    title: 'Job Application Status Updated',
    body: `Your job application status has been updated to ${payload.status.replace('_', ' ')}.`,
    data: {
      type: NotificationTypes.jobApplicationUpdate,
      jobId: application.job_id,
      applicationId,
      status: payload.status,
    },
  });

  return updatedApplication;
};
