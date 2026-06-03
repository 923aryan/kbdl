import { prisma, Rating, safeEmployerSelect, safeUserSelect, Shift } from '@repo/db/server';
import {
  AcceptShiftPayload,
  CreateShiftPayload,
  GetBestShiftMatchesQuery,
  GetBestShiftMatchesResponse,
  GetCreatedShiftsForEmployeeResponse,
  GetEmployeeShiftsResponse,
  GetExtraShiftsQuery,
  GetExtraShiftsResponse,
  GetLatestShiftsQuery,
  GetLatestShiftsResponse,
  GetOpenShiftsForEmployeeResponse,
  getReferredEmployeePayload,
  getReferredEmployeeResponse,
  GetShiftDetailsResponse,
  RateShiftPayload,
  ShiftWithNotification,
  UpdateShiftPayload,
} from '@repo/types';
import { publicShiftQueue } from '../config/queues/public-shift-queue';
import { createNotificationService } from '../notifications/notification-service';
import { AppError } from '../utils/api-error';
import { NotificationTypes, Role, ROLES, ShiftStatus } from '../utils/constants';
// A. Create Shift Swap
export const createShiftService = async (
  userId: string,
  userType: Extract<Role, 'user' | 'employer'>,
  payload: CreateShiftPayload,
): Promise<Shift> => {
  let employerId;
  let originalEmployeeId = payload.original_employee_id;

  if (payload.replacement_employee_id) {
    const replacementEmployee = await prisma.user.findUnique({
      where: {
        id: payload.replacement_employee_id,
      },
    });

    if (!replacementEmployee?.extra_shift) {
      throw new AppError(
        403,
        'DONT_WANT_SHIFTS',
        'This user dont want shifts right now, ask them to enable it in Profile -> Extra Shifts',
      );
    }
  }

  if (payload.replacement_employee_id && payload.replacement_employee_id === userId) {
    throw new AppError(403, 'SELF_SHIFT_NOT_ALLOWED', 'You cant swap a shift with yourself');
  }
  // 1. If created by an employee (user)
  if (userType === 'user') {
    originalEmployeeId = userId; // Enforce that the user is the original employeeS
    console.log('origian ', userId);
    // Validate that the user is actually employed by the specified employer
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    employerId = user?.employer_id;
    if (!employerId) {
      throw new AppError(403, 'NOT_EMPLOYED', 'You are not an employee of any organization');
    }
    const employment = await prisma.employeeEmployment.findFirst({
      where: {
        employee_id: userId,
        employer_id: employerId,
        employment_status: 'active',
      },
    });

    if (!employment) {
      throw new AppError(
        403,
        'NOT_EMPLOYED',
        'You are not an active employee of this organization.',
      );
    }
  }
  // 2. If created by the organization (employer)
  else if (userType === ROLES.EMPLOYER) {
    employerId = userId; // Enforce that the creator is the employer

    if (!originalEmployeeId) {
      throw new AppError(
        400,
        'MISSING_EMPLOYEE',
        'Employer must specify the original employee ID for the shift swap.',
      );
    }

    // Validate that the specified employee works for this employer
    const employment = await prisma.employeeEmployment.findFirst({
      where: {
        employee_id: originalEmployeeId,
        employer_id: employerId,
        employment_status: 'active',
      },
    });

    if (!employment) {
      throw new AppError(
        403,
        'INVALID_EMPLOYEE',
        'This user is not an active employee of your organization.',
      );
    }
  }
  console.log('origian 1 ', originalEmployeeId);

  if (!employerId) {
    throw new AppError(400, 'MISSING_EMPLOYER', 'Employer ID is required.');
  }

  if (!originalEmployeeId) {
    throw new AppError(400, 'MISSING_EMPLOYEE', 'Original employee ID is required.');
  }

  // 3. Create the shift
  const newShift = await prisma.shift.create({
    data: {
      original_employee_id: originalEmployeeId,
      employer_id: employerId,
      replacement_employee_id: payload.replacement_employee_id || null, // Null implies a public shift
      created_by: userType,
      payType: payload.payType,
      shift_pay: payload.shift_pay,
      shift_date: new Date(payload.shift_date),
      shift_start: new Date(payload.shift_start),
      shift_end: new Date(payload.shift_end),
      skill_required: payload.skill_required,
      status: 'open',
      request_accepted: false,
      organization_approved: userType === ROLES.EMPLOYER, // Auto-approve if created by employer
    },
  });

  //Specific shift to a employee / Not public shift
  if (payload.replacement_employee_id) {
    await createNotificationService({
      userId: payload.replacement_employee_id,

      type: NotificationTypes.shiftSwapRequest,

      title: 'New Shift Swap Request',

      body: 'You received a shift swap request.',

      data: {
        type: NotificationTypes.shiftSwapRequest,
        shiftId: newShift.id,
        employerId,
        originalEmployeeId,
        replacementEmployeeId: payload.replacement_employee_id,
      },
    });
  } else {
    //Public Shit : create pubic shift via message broker BullMQ
    await publicShiftQueue.add('broadcast-public-shift', {
      shiftId: newShift.id,
      employerId,
      originalEmployeeId,
      skillRequired: newShift.skill_required,
    });
  }

  return newShift;
};

// A. Accept Shift Swap
export const acceptShiftService = async (
  workerId: string,
  payload: AcceptShiftPayload,
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: { id: payload.shift_id },
  });

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }

  if (shift.status !== 'open') {
    throw new AppError(400, 'SHIFT_NOT_OPEN', 'This shift is no longer open for acceptance.');
  }

  if (shift.original_employee_id === workerId) {
    throw new AppError(400, 'SELF_ACCEPT_ERROR', 'You cannot accept your own shift swap request.');
  }

  // If replacement_employee_id is already set, it's a direct request. Ensure the accepting worker is the requested one.
  if (shift.replacement_employee_id && shift.replacement_employee_id !== workerId) {
    throw new AppError(
      403,
      'NOT_REQUESTED',
      'This shift swap was requested for a specific employee.',
    );
  }

  if (!shift?.replacement_employee_id) {
    await prisma.notification.updateMany({
      where: {
        type: NotificationTypes.publicShiftSwap,
        user_id: workerId,
        data: {
          path: ['shiftId'],
          equals: shift.id,
        },
      },
      data: {
        isRead: true,
      },
    });
  }
  // Accept the shift
  const status =
    shift?.replacement_employee_id && shift.created_by === ROLES.EMPLOYER
      ? ShiftStatus.approved
      : ShiftStatus.pending;

  const updatedShift = await prisma.shift.update({
    where: { id: payload.shift_id },
    data: {
      replacement_employee_id: workerId,
      request_accepted: true,
      status: status, // Update status to reflect it has been accepted
    },
  });

  return updatedShift;
};

// B1. See Accepted Shifts (Worker)
export const getEmployeeShiftsService = async (
  employeeId: string,
): Promise<GetEmployeeShiftsResponse> => {
  const shifts = await prisma.$queryRaw`
    SELECT
      s.*,

      json_build_object(
        'company_name', e.company_name,
        'company_address', e.company_address,

        'company_location',
        ARRAY[
          ST_X(e.company_location::geometry),
          ST_Y(e.company_location::geometry)
        ]
      ) as employer,

      json_build_object(
        'name', u.name,
        'phone_no', u.phone_no
      ) as original_employee

    FROM shifts s

    INNER JOIN employers e
      ON e.id = s.employer_id

    INNER JOIN users u
      ON u.id = s.original_employee_id

    WHERE
      s.replacement_employee_id = ${employeeId}
      AND s.request_accepted = true
      AND s.status IN ('pending', 'approved')

    ORDER BY s.shift_start ASC
  `;

  return shifts as GetEmployeeShiftsResponse;
};

// B1.5 See Created Shifts (Worker)
export const getCreatedShiftsForEmployeeService = async (
  employeeId: string,
): Promise<GetCreatedShiftsForEmployeeResponse> => {
  const shifts = await prisma.shift.findMany({
    where: {
      original_employee_id: employeeId,
      created_by: ROLES.USER,
    },
    include: {
      employer: { select: { company_name: true, company_address: true } },
      replacement_employee: { select: { name: true, phone_no: true } },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return shifts as GetCreatedShiftsForEmployeeResponse;
};

// B2. See Created Shifts (Employer)
export const getEmployerShiftsService = async (employerId: string): Promise<Shift[]> => {
  const shifts = await prisma.shift.findMany({
    where: {
      employer_id: employerId,
    },
    include: {
      original_employee: {
        select: { name: true, phone_no: true, skills: true },
      },
      replacement_employee: {
        select: { name: true, phone_no: true, skills: true },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return shifts;
};

export const getScheduledShiftsService = async (employeeId: string): Promise<Shift[]> => {
  const shifts = await prisma.shift.findMany({
    where: {
      replacement_employee_id: employeeId,
      status: {
        in: [ShiftStatus.approved, ShiftStatus.pending, ShiftStatus.matched],
      },
    },
    include: {
      employer: {
        select: { company_name: true, company_address: true },
      },
      original_employee: {
        select: { name: true, phone_no: true },
      },
    },
    orderBy: {
      shift_start: 'asc',
    },
  });
  console.log('shifts are ', shifts);
  return shifts;
};

export const cancelShiftService = async (
  userId: string,
  userType: 'user' | 'employer',
  shiftId: string,
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  });

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }

  if (shift.status === 'completed' || shift.status === 'cancelled') {
    throw new AppError(
      400,
      'INVALID_STATE',
      `Cannot cancel a shift that is already ${shift.status}.`,
    );
  }

  // Authorization check
  if (userType === ROLES.USER) {
    // A user can cancel if they are the one who requested it OR the one who accepted it
    if (shift.original_employee_id !== userId && shift.replacement_employee_id !== userId) {
      throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to cancel this shift.');
    }
  } else if (userType === ROLES.EMPLOYER) {
    // An employer can cancel shifts under their organization
    if (shift.employer_id !== userId) {
      throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to cancel this shift.');
    }
  }

  const cancelledShift = await prisma.shift.update({
    where: { id: shiftId },
    data: {
      status: 'cancelled',
    },
  });

  return cancelledShift;
};

// B4. Update Shift (Only before acceptance)
export const updateShiftService = async (
  userId: string,
  userType: 'user' | 'employer',
  payload: UpdateShiftPayload,
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: { id: payload.shift_id },
  });

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }

  // Core Business Rule: Cannot update if already accepted
  if (shift.request_accepted || shift.status !== 'open') {
    throw new AppError(
      400,
      'UPDATE_FORBIDDEN',
      'Cannot update a shift once it has been accepted or is no longer open.',
    );
  }

  // Authorization check
  if (userType === 'user' && shift.original_employee_id !== userId) {
    throw new AppError(403, 'UNAUTHORIZED', 'Only the creator can update this shift.');
  }
  if (userType === ROLES.EMPLOYER && shift.employer_id !== userId) {
    throw new AppError(403, 'UNAUTHORIZED', 'Only the employer who owns this shift can update it.');
  }

  const updatedShift = await prisma.shift.update({
    where: { id: payload.shift_id },
    data: {
      shift_date: payload.shift_date ? new Date(payload.shift_date) : undefined,
      shift_start: payload.shift_start ? new Date(payload.shift_start) : undefined,
      shift_end: payload.shift_end ? new Date(payload.shift_end) : undefined,
      skill_required: payload.skill_required,
      replacement_employee_id: payload.replacement_employee_id,
    },
  });

  return updatedShift;
};

// C. Get Extra Shifts (Public matching)
export const getExtraShiftsService = async (
  query: GetExtraShiftsQuery,
  userId: string,
): Promise<GetExtraShiftsResponse> => {
  const { skill, date, latitude, longitude, radius = 10, limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const conditions: string[] = [
    `s.status = 'open'`,
    `s.request_accepted = false`,
    `s.replacement_employee_id IS NULL`,
    `e.company_location IS NOT NULL`,
  ];

  const values: any[] = [];
  let paramIndex = 1;

  // Nearby filter (dynamic radius)
  conditions.push(`
    ST_DWithin(
      e.company_location,
      ST_SetSRID(
        ST_MakePoint($${paramIndex}, $${paramIndex + 1}),
        4326
      )::geography,
      $${paramIndex + 2}
    )
  `);

  // IMPORTANT:
  // ST_MakePoint(longitude, latitude)
  values.push(longitude, latitude, radius * 1000);

  paramIndex += 3;

  conditions.push(`
    s.original_employee_id != $${paramIndex}
  `);

  values.push(userId);

  paramIndex++;

  // Skill filter
  if (skill) {
    conditions.push(`
      s.skill_required ILIKE $${paramIndex}
    `);

    values.push(`%${skill}%`);

    paramIndex++;
  }

  // Date filter
  if (date) {
    conditions.push(`
      s.shift_date >= $${paramIndex}
    `);

    values.push(new Date(date));

    paramIndex++;
  }

  // Pagination
  const limitIndex = paramIndex;
  values.push(limit);

  paramIndex++;

  const offsetIndex = paramIndex;
  values.push(skip);

  const shifts = await prisma.$queryRawUnsafe<Shift[]>(
    `
    SELECT
      s.*,

      json_build_object(
        'company_name', e.company_name,
        'company_address', e.company_address
      ) AS employer

    FROM shifts s

    INNER JOIN employers e
      ON s.employer_id = e.id

    WHERE ${conditions.join(' AND ')}

    ORDER BY s.shift_date ASC

    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `,
    ...values,
  );

  return shifts as GetExtraShiftsResponse;
};
// D. Rate Employee/Employer
export const rateShiftService = async (
  raterId: string,
  raterType: 'user' | 'employer',
  payload: RateShiftPayload,
): Promise<Rating> => {
  const shift = await prisma.shift.findUnique({
    where: { id: payload.shift_id },
  });

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }

  // Ensure rating happens only after a shift is completed or matched.
  // Adjust this condition based on your exact domain rules.
  if (shift.status === 'open' || shift.status === 'cancelled') {
    throw new AppError(400, 'INVALID_STATE', 'Cannot rate a shift that is open or cancelled.');
  }

  // Construct rating payload depending on who is rating whom
  const ratingData: any = {
    shift_id: payload.shift_id,
    user_id: payload.user_id, // The ID of the employee receiving the rating
    score: payload.score,
    flagged_issue: payload.flagged_issue,
  };

  if (raterType === ROLES.EMPLOYER) {
    ratingData.employer_id = raterId;
  } else {
    // If a user is rating another user (e.g., replacement rating the original, or vice versa)
    ratingData.user_employer_id = raterId;
  }

  const newRating = await prisma.rating.create({
    data: ratingData,
  });

  // Optional: Trigger a background job or update query here to recalculate the user's overall `rating_avg` in the User table

  return newRating;
};

// E. Find id of referred employee
export const getReferredEmployeeService = async (
  payload: getReferredEmployeePayload,
): Promise<getReferredEmployeeResponse> => {
  const employee = await prisma.user.findUnique({
    where: {
      phone_no: payload.phone_no,
    },
    select: {
      id: true,
      extra_shift: true,
    },
  });
  if (!employee) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
  }
  if (!employee.extra_shift) {
    throw new AppError(
      400,
      'DONT_WANT_SHIFTS',
      'This user dont want shifts right now, ask them to enable it in Profile -> Extra Shifts',
    );
  }
  return {
    id: employee.id,
  };
};

// F. Get Open shifts for employee (specific shifts -> check shifs table, public shifts -> check notificaion table)
export const getOpenShiftsForEmployeeService = async (
  userId: string,
): Promise<GetOpenShiftsForEmployeeResponse> => {
  /*
    1. Specific shifts directly assigned
  */
  const requestedSpecificShifts = await prisma.shift.findMany({
    where: {
      replacement_employee_id: userId,
      status: ShiftStatus.open,
    },

    include: {
      original_employee: {
        select: safeUserSelect,
      },

      employer: {
        select: safeEmployerSelect,
      },
    },
  });

  /*
    2. Public shift notifications received by this user
  */
  const publicShiftNotifications = await prisma.notification.findMany({
    where: {
      user_id: userId,
      type: NotificationTypes.publicShiftSwap,
      isRead: false,
    },

    select: {
      id: true,
      data: true,
    },
  });

  /*
    3. Extract shiftIds + build notification map
  */
  const notificationMap = new Map<string, string>();

  const publicShiftIds = publicShiftNotifications
    .map((notification) => {
      const data = notification.data as { shiftId?: string };

      if (!data?.shiftId) return null;

      // shiftId -> notificationId
      notificationMap.set(data.shiftId, notification.id);

      return data.shiftId;
    })
    .filter((shiftId): shiftId is string => Boolean(shiftId));

  /*
    4. Fetch public shifts
  */
  const publicShifts =
    publicShiftIds.length > 0
      ? await prisma.shift.findMany({
          where: {
            id: {
              in: publicShiftIds,
            },

            status: 'open',

            // Ensure still public
            replacement_employee_id: null,
          },

          include: {
            original_employee: {
              select: safeUserSelect,
            },

            employer: {
              select: safeEmployerSelect,
            },
          },
        })
      : [];

  /*
    5. Attach notificationId to public shifts
  */
  const publicShiftsWithNotificationId = publicShifts.map((shift) => ({
    ...shift,
    notificationId: notificationMap.get(shift.id) ?? null,
  }));

  /*
    6. Merge + remove duplicates
  */
  const uniqueShiftsMap = new Map<string, ShiftWithNotification>();

  requestedSpecificShifts.forEach((shift) => {
    uniqueShiftsMap.set(shift.id, shift);
  });

  publicShiftsWithNotificationId.forEach((shift) => {
    uniqueShiftsMap.set(shift.id, shift);
  });

  const shifts = Array.from(uniqueShiftsMap.values());

  /*
    7. Sort newest first
  */
  shifts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return shifts;
};

export const getLatestShiftsService = async (
  query: GetLatestShiftsQuery,
  userId: string,
): Promise<GetLatestShiftsResponse> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  // 1. Fetch user's location directly from the database
  const userResult = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT 
      ST_X(location::geometry) AS longitude,
      ST_Y(location::geometry) AS latitude
    FROM users
    WHERE id = $1
    `,
    userId,
  );

  const user = userResult[0];

  if (!user || user.latitude === null || user.longitude === null) {
    throw new Error('User location is not set. Cannot calculate distance.');
  }

  const { latitude, longitude } = user;

  // 2. Query shifts sorted by creation date
  const shifts = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT 
      s.*,
      json_build_object(
        'company_name', e.company_name,
        'company_address', e.company_address,
        'is_verified', e.is_verified
      ) AS employer,
      ROUND((ST_Distance(
        e.company_location, 
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) / 10000)::numeric, 1) AS distance_in_km
    FROM shifts s
    INNER JOIN employers e ON s.employer_id = e.id
    WHERE s.status = 'open' 
      AND s.request_accepted = false 
      AND s.replacement_employee_id IS NULL
      AND s.original_employee_id != $3
      AND e.company_location IS NOT NULL
    ORDER BY s.created_at DESC
    LIMIT $4 OFFSET $5
  `,
    longitude, // $1
    latitude, // $2
    userId, // $3
    limit, // $4
    skip, // $5
  );

  return shifts as GetLatestShiftsResponse;
};

export const getBestShiftMatchesService = async (
  query: GetBestShiftMatchesQuery,
  userId: string,
): Promise<GetBestShiftMatchesResponse> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  // 1. Fetch user's location AND skills in a single query
  const userResult = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT 
      skills,
      ST_X(location::geometry) AS longitude,
      ST_Y(location::geometry) AS latitude
    FROM users
    WHERE id = $1
    `,
    userId,
  );

  const user = userResult[0];

  if (!user || user.latitude === null || user.longitude === null) {
    throw new Error('User location is not set. Cannot calculate matches.');
  }

  const { latitude, longitude } = user;
  const userSkills = user.skills && user.skills.length > 0 ? user.skills : [];
  const UserSkills = userSkills.map((skill: string) => skill.toLowerCase());

  const conditions: string[] = [
    `s.status = 'open'`,
    `s.request_accepted = false`,
    `s.replacement_employee_id IS NULL`,
    `s.original_employee_id != $3`,
    `e.company_location IS NOT NULL`,
  ];

  // 2. Dynamically add the skill filter if the user has skills
  if (UserSkills.length > 0) {
    conditions.push(`LOWER(s.skill_required) = ANY($6::text[])`);
  }

  const whereClause = conditions.join(' AND ');

  // 3. Query sorted by Distance ASC, then Date ASC
  const shifts = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT 
      s.*,
      json_build_object(
        'company_name', e.company_name,
        'company_address', e.company_address,
        'is_verified', e.is_verified
      ) AS employer,
      ROUND((ST_Distance(
        e.company_location, 
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) / 1000)::numeric, 1) AS distance_in_km
    FROM shifts s
    INNER JOIN employers e ON s.employer_id = e.id
    WHERE ${whereClause}
    ORDER BY distance_in_km ASC, s.shift_date ASC
    LIMIT $4 OFFSET $5
  `,
    longitude, // $1
    latitude, // $2
    userId, // $3
    limit, // $4
    skip, // $5
    UserSkills, // $6
  );

  return shifts as GetBestShiftMatchesResponse;
};

export const getPendingShiftsForEmployerService = async (employerId: string) => {
  const shifts = await prisma.shift.findMany({
    where: {
      employer_id: employerId,
      status: 'pending',
    },
    include: {
      original_employee: {
        select: { name: true, phone_no: true },
      },
      replacement_employee: {
        select: { name: true, phone_no: true },
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
  });
  return shifts;
};

export const approveShiftRequestService = async (
  employerId: string,
  shiftId: string,
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  });
  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }
  if (shift.employer_id !== employerId) {
    throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to approve this shift.');
  }
  if (shift.status !== 'pending') {
    throw new AppError(400, 'INVALID_STATE', 'Only pending shifts can be approved.');
  }
  return prisma.shift.update({
    where: { id: shiftId },
    data: {
      status: ShiftStatus.approved,
      organization_approved: true,
    },
  });
};

export const getShiftDetailsService = async (
  userId: string,
  userType: 'user' | 'employer',
  shiftId: string,
): Promise<GetShiftDetailsResponse> => {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      original_employee: {
        select: safeUserSelect,
      },
      replacement_employee: {
        select: safeUserSelect,
      },
      employer: {
        select: safeEmployerSelect,
      },
    },
  });

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }

  if (userType === ROLES.EMPLOYER && shift.employer_id !== userId) {
    throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to view this shift.');
  }

  if (
    userType === ROLES.USER &&
    shift.original_employee_id !== userId &&
    shift.replacement_employee_id !== userId &&
    !(shift.replacement_employee_id === null && shift.status === 'open')
  ) {
    throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to view this shift.');
  }

  return shift;
};

export const approveShiftCompletionService = async (
  employerId: string,
  shiftId: string,
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  });
  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }
  if (shift.employer_id !== employerId) {
    throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to modify this shift.');
  }
  if (shift.shift_start.getTime() > Date.now()) {
    throw new AppError(
      400,
      'SHIFT_NOT_STARTED',
      'Cannot approve completion for a shift that has not started yet.',
    );
  }
  return prisma.shift.update({
    where: { id: shiftId },
    data: {
      status: ShiftStatus.completed,
      organization_approved: true,
    },
  });
};

export const reportShiftNoShowService = async (
  employerId: string,
  shiftId: string,
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  });
  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }
  if (shift.employer_id !== employerId) {
    throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to modify this shift.');
  }

  if (shift.status === ShiftStatus.completed) {
    throw new AppError(
      400,
      'SHIFT_ALREADY_COMPLETED',
      'Cannot report a no-show for a shift that has already been marked as completed.',
    );
  }

  if (shift.status !== ShiftStatus.approved) {
    throw new AppError(
      400,
      'SHIFT_NOT_APPROVED',
      'No-show can only be reported for shifts that have been approved and are ready to be worked.',
    );
  }
  if (shift.no_show_reported) {
    throw new AppError(
      400,
      'ALREADY_REPORTED',
      'No-show has already been reported for this shift.',
    );
  }

  return prisma.shift.update({
    where: { id: shiftId },
    data: {
      no_show_reported: true,
    },
  });
};
