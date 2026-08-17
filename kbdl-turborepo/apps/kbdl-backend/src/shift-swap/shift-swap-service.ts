import { PlatformType, prisma, Rating, safeUserSelect, Shift } from '@repo/db/server';
import {
  companyAsEmployerInclude,
  toApiCreatedBy,
  toEmployerDtoFromIncludedCompany,
  toPlatformType,
  withApiEmployerFields,
} from '../compat/employer-compat';
import {
  AcceptShiftPayload,
  ApplyForPublicShiftPayload,
  ApplyForPublicShiftResponse,
  ApproveShiftPayload,
  CreateShiftPayload,
  GetBestShiftMatchesQuery,
  GetCreatedShiftsForEmployeeResponse,
  GetEmployeeShiftsResponse,
  GetEmployerShiftAnalyticsResponse,
  GetEmployerShiftsQuery,
  GetExtraShiftsQuery,
  GetExtraShiftsResponse,
  GetLatestShiftsQuery,
  GetOpenShiftsForEmployeeResponse,
  GetPendingShiftsQuery,
  GetPendingShiftsResponse,
  GetPublicShiftDetailsResponse,
  GetPublicShiftsQuery,
  GetPublicShiftsResponse,
  getReferredEmployeePayload,
  getReferredEmployeeResponse,
  GetShiftDetailsQuery,
  GetShiftDetailsResponse,
  RateShiftPayload,
  RejectShiftResponse,
  ShiftWithDistance,
  ShiftWithNotification,
  UpdateShiftPayload,
  WithdrawShiftApplicationResponse,
} from '@repo/types';
import { publicShiftQueue } from '../config/queues/public-shift-queue';
import { createNotificationService } from '../notifications/notification-service';
import { AppError } from '../utils/api-error';
import {
  findActiveEmploymentForAppUserAtCompany,
  findPrimaryActiveEmploymentForAppUser,
} from '../operations/workforce-person-service';
import {
  NotificationTypes,
  Role,
  ROLES,
  ShiftApplicationStatus,
  ShiftApplicationType,
  ShiftStatus,
} from '../utils/constants';

/** Company for shift-swap — most recent active employment when worker has several. */
async function resolveUserCompanyIdForShift(userId: string): Promise<string | null> {
  const employment = await findPrimaryActiveEmploymentForAppUser(userId);
  return employment?.company_id ?? null;
}

/** Employer roster check — membership comes from active employment only. */
async function assertUserOnEmployerRoster(
  employeeUserId: string,
  companyId: string,
): Promise<void> {
  const employment = await findActiveEmploymentForAppUserAtCompany(employeeUserId, companyId);

  if (!employment) {
    throw new AppError(
      403,
      'INVALID_EMPLOYEE',
      'This user is not an active employee of your organization.',
    );
  }
}

const mapShiftWithCompanyToApi = (row: any) => {
  const { company, ...rest } = row;
  return {
    ...rest,
    employer_id: rest.company_id,
    employer: company
      ? toEmployerDtoFromIncludedCompany(company) ?? {
          company_name: company.company_name,
          company_address: company.company_address,
          is_verified: company.is_verified,
        }
      : null,
    created_by: rest.created_by != null ? toApiCreatedBy(rest.created_by) : rest.created_by,
  };
};

// A. Create Shift Swap
export const createShiftService = async (
  userId: string,
  userType: Extract<Role, 'user' | 'employer'>,
  payload: CreateShiftPayload,
): Promise<Shift> => {
  let employerId;
  let originalEmployeeId = payload.original_employee_id;

  // extra_shift is notification-only (public-shift broadcast). Never block employer-assigned shifts.
  if (payload.replacement_employee_id) {
    const replacementEmployee = await prisma.user.findUnique({
      where: { id: payload.replacement_employee_id },
      select: { id: true },
    });
    if (!replacementEmployee) {
      throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Replacement employee not found.');
    }
  }

  if (payload.replacement_employee_id && payload.replacement_employee_id === userId) {
    throw new AppError(403, 'SELF_SHIFT_NOT_ALLOWED', 'You cant swap a shift with yourself');
  }
  // 1. If created by an employee (user)
  if (userType === 'user') {
    originalEmployeeId = userId;
    employerId = await resolveUserCompanyIdForShift(userId);
    if (!employerId) {
      throw new AppError(403, 'NOT_EMPLOYED', 'You are not an employee of any organization');
    }
  }
  // 2. If created by the organization (employer)
  else if (userType === ROLES.EMPLOYER) {
    employerId = userId;

    if (!originalEmployeeId) {
      throw new AppError(
        400,
        'MISSING_EMPLOYEE',
        'Employer must specify the original employee ID for the shift swap.',
      );
    }

    await assertUserOnEmployerRoster(originalEmployeeId, employerId);
  }
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
      company_id: employerId,
      replacement_employee_id: payload.replacement_employee_id || null, // Null implies a public shift
      created_by: toPlatformType(userType),
      payType: payload.payType,
      shift_pay: payload.shift_pay,
      shift_date: new Date(payload.shift_date),
      shift_start: new Date(payload.shift_start),
      shift_end: new Date(payload.shift_end),
      skill_required: payload.skill_required,
      status: ShiftStatus.open,
      request_accepted: false,
      organization_approved:
        payload?.replacement_employee_id && userType === ROLES.EMPLOYER ? true : false, // Auto-approve if created by employer
    },
  });

  //Specific shift to a employee / Not public shift
  if (payload.replacement_employee_id) {
    await prisma.shiftApplication.create({
      data: {
        shift_id: newShift.id,
        user_id: payload.replacement_employee_id,
        type: ShiftApplicationType.invited,
        status: ShiftApplicationStatus.pending,
      },
    });

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

  return withApiEmployerFields(newShift) as any;
};
export const withdrawShiftApplicationService = async (
  workerId: string,
  shift_application_id: string,
): Promise<WithdrawShiftApplicationResponse> => {
  const application = await prisma.shiftApplication.findUnique({
    where: {
      shift_id_user_id: {
        shift_id: shift_application_id,
        user_id: workerId,
      },
    },
    include: {
      shift: true,
    },
  });

  if (!application) {
    throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Shift application not found.');
  }

  if (
    application.status === ShiftApplicationStatus.withdrawn ||
    application.status === ShiftApplicationStatus.rejected
  ) {
    throw new AppError(400, 'CANNOT_WITHDRAW', `Application is already ${application.status}.`);
  }

  const shift = application.shift;

  const updatedApplication = await prisma.$transaction(async (tx) => {
    // Always withdraw the application
    const withdrawnApplication = await tx.shiftApplication.update({
      where: { id: application.id },
      data: { status: ShiftApplicationStatus.withdrawn },
    });

    if (application.type === ShiftApplicationType.invited) {
      // 1. Accepted and invited: cancel the shift (also safely handles pending and invited)
      await tx.shift.update({
        where: { id: application.shift_id },
        data: {
          status:
            application.status === ShiftApplicationStatus.accepted
              ? ShiftStatus.cancelled
              : ShiftStatus.rejected,
        },
      });
    } else if (application.type === ShiftApplicationType.applied) {
      // 2. Pending and applied: just withdraw from shift application (handled above)
      if (application.status === ShiftApplicationStatus.accepted) {
        // 3. Accepted and applied: update shift to open, reset fields, and re-broadcast
        await tx.shift.update({
          where: { id: application.shift_id },
          data: {
            replacement_employee_id: null,
            request_accepted: false,
            organization_approved: false,
            status: ShiftStatus.open,
          },
        });

        await publicShiftQueue.add('broadcast-public-shift', {
          shiftId: shift.id,
          employerId: shift.company_id,
          originalEmployeeId: shift.original_employee_id,
          skillRequired: shift.skill_required,
        });
      }
    }
    await prisma.notification.updateMany({
      where: {
        type: NotificationTypes.shiftSwapRequest,
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

    return withdrawnApplication;
  });

  return updatedApplication;
};

export const approveShiftRequestService = async (
  employerId: string,
  payload: ApproveShiftPayload,
): Promise<Shift> => {
  const shiftApplication = await prisma.shiftApplication.findUnique({
    where: {
      id: payload.shift_application_id,
    },

    include: {
      shift: true,
    },
  });

  if (!shiftApplication) {
    throw new AppError(404, 'SHIFT_APPLICATION_NOT_FOUND', 'Shift application not found.');
  }

  const shift = shiftApplication.shift;

  if (shift.company_id !== employerId) {
    throw new AppError(
      403,
      'UNAUTHORIZED',
      'You do not have permission to approve this shift request.',
    );
  }

  if (shift.status !== ShiftStatus.open) {
    throw new AppError(400, 'SHIFT_NOT_OPEN', 'This shift is no longer open.');
  }

  if (shift.organization_approved) {
    throw new AppError(400, 'SHIFT_ALREADY_APPROVED', 'This shift has already been approved.');
  }

  if (shiftApplication.status !== ShiftApplicationStatus.pending) {
    throw new AppError(
      400,
      'INVALID_APPLICATION_STATUS',
      'Only pending applications can be approved.',
    );
  }

  const updatedShift = await prisma.$transaction(async (tx) => {
    /*
      Accept selected application
    */
    await tx.shiftApplication.update({
      where: {
        id: shiftApplication.id,
      },

      data: {
        status: ShiftApplicationStatus.accepted,
      },
    });

    /*
      Reject everyone else
    */
    await tx.shiftApplication.updateMany({
      where: {
        shift_id: shift.id,

        id: {
          not: shiftApplication.id,
        },

        status: {
          in: [ShiftApplicationStatus.pending, ShiftApplicationStatus.accepted],
        },
      },

      data: {
        status: ShiftApplicationStatus.rejected,
      },
    });

    /*
      Approve shift
    */
    return tx.shift.update({
      where: {
        id: shift.id,
      },

      data: {
        replacement_employee_id: shiftApplication.user_id,
        request_accepted: true,
        organization_approved: true,
        status: ShiftStatus.approved,
      },
    });
  });

  await prisma.notification.updateMany({
    where: {
      user_id: {
        not: shiftApplication.user_id,
      },
      type: NotificationTypes.publicShiftSwap,
      data: {
        path: ['shiftId'],
        equals: shift.id,
      },
    },

    data: {
      isRead: true,
    },
  });

  await createNotificationService({
    userId: shiftApplication.user_id,
    type: NotificationTypes.shiftApproved,
    title: 'Shift Request Approved',
    body: 'Your application for the shift has been approved. You have been assigned to this shift.',
    data: {
      type: NotificationTypes.shiftApproved,
      shiftId: shift.id,
      employerId: shift.company_id,
      originalEmployeeId: shift.original_employee_id,
      replacementEmployeeId: shiftApplication.user_id,
    },
  });

  return updatedShift;
};

// B1. See Applied/Accepted Shifts (Worker)
export const getEmployeeShiftsService = async (
  employeeId: string,
): Promise<GetEmployeeShiftsResponse> => {
  const shifts = await prisma.shift.findMany({
    where: {
      shift_start: {
        gt: new Date(),
      },

      status: {
        in: [ShiftStatus.open, ShiftStatus.approved],
      },

      OR: [
        {
          replacement_employee_id: employeeId,
          request_accepted: true,
        },

        {
          shiftApplications: {
            some: {
              user_id: employeeId,
              status: {
                in: [
                  ShiftApplicationStatus.pending,
                  ShiftApplicationStatus.accepted,
                  ShiftApplicationStatus.rejected,
                  ShiftApplicationStatus.withdrawn,
                ],
              },
              NOT: {
                status: ShiftApplicationStatus.pending,
                type: ShiftApplicationType.invited,
              },
            },
          },
        },
      ],
    },

    include: {
      company: companyAsEmployerInclude,

      original_employee: {
        select: safeUserSelect,
      },

      shiftApplications: {
        where: {
          user_id: employeeId,
        },

        take: 1,
      },
    },

    orderBy: {
      shift_start: 'asc',
    },
  });

  const transformedShifts = shifts.map(({ shiftApplications, ...shift }) =>
    mapShiftWithCompanyToApi({
      ...shift,
      shiftApplication: shiftApplications[0] ?? null,
    }),
  );

  return transformedShifts as GetEmployeeShiftsResponse;
};

// B2. See Created Shifts (Employer)
export const getEmployerShiftsService = async (
  employerId: string,
  query: GetEmployerShiftsQuery,
): Promise<{ shifts: Shift[]; meta: Record<string, number> }> => {
  const {
    limit = 10,
    page = 1,
    status,
    payType,
    request_accepted,
    skill_required,
    organization_approved,
    no_show_reported,
    shift_date_from,
    shift_date_to,
    shift_start_from,
    shift_start_to,
    shift_end_from,
    shift_end_to,
    shift_pay_min,
    shift_pay_max,
  } = query;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    company_id: employerId,
  };

  if (status) whereClause.status = status;
  if (payType) whereClause.payType = payType;
  if (request_accepted !== undefined) whereClause.request_accepted = request_accepted;
  if (skill_required)
    whereClause.skill_required = { contains: skill_required, mode: 'insensitive' };
  if (organization_approved !== undefined)
    whereClause.organization_approved = organization_approved;
  if (no_show_reported !== undefined) whereClause.no_show_reported = no_show_reported;

  if (shift_date_from || shift_date_to) {
    whereClause.shift_date = {
      ...(shift_date_from && { gte: new Date(shift_date_from) }),
      ...(shift_date_to && { lte: new Date(shift_date_to) }),
    };
  }

  if (shift_start_from || shift_start_to) {
    whereClause.shift_start = {
      ...(shift_start_from && { gte: new Date(shift_start_from) }),
      ...(shift_start_to && { lte: new Date(shift_start_to) }),
    };
  }

  if (shift_end_from || shift_end_to) {
    whereClause.shift_end = {
      ...(shift_end_from && { gte: new Date(shift_end_from) }),
      ...(shift_end_to && { lte: new Date(shift_end_to) }),
    };
  }

  if (shift_pay_min !== undefined || shift_pay_max !== undefined) {
    whereClause.shift_pay = {
      ...(shift_pay_min !== undefined && { gte: shift_pay_min }),
      ...(shift_pay_max !== undefined && { lte: shift_pay_max }),
    };
  }

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where: whereClause,
      include: {
        original_employee: {
          select: { name: true, phone_no: true, skills: true },
        },
        replacement_employee: {
          select: { name: true, phone_no: true, skills: true },
        },
        shiftApplications: {
          include: {
            user: {
              select: { name: true, phone_no: true, skills: true },
            },
          },
          orderBy: {
            updated_at: 'desc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      skip,
    }),
    prisma.shift.count({
      where: whereClause,
    }),
  ]);

  return {
    shifts: shifts.map((s) => ({
      ...s,
      employer_id: s.company_id,
      created_by: toApiCreatedBy(s.created_by),
    })) as any,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// B3. See Created Shifts (Worker)
export const getCreatedShiftsForEmployeeService = async (
  employeeId: string,
): Promise<GetCreatedShiftsForEmployeeResponse> => {
  const shifts = await prisma.shift.findMany({
    where: {
      original_employee_id: employeeId,
      created_by: PlatformType.EMPLOYEE,
    },
    include: {
      company: { select: { company_name: true, company_address: true } },
      replacement_employee: { select: { name: true, phone_no: true } },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return shifts.map(mapShiftWithCompanyToApi) as GetCreatedShiftsForEmployeeResponse;
};

export const getScheduledShiftsService = async (employeeId: string): Promise<Shift[]> => {
  const shifts = await prisma.shift.findMany({
    where: {
      replacement_employee_id: employeeId,
      status: {
        in: [ShiftStatus.approved],
      },
      shift_start: {
        gt: new Date(),
      },
    },
    include: {
      company: {
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
  return shifts.map((s) => {
    const { company, ...rest } = s as typeof s & { company?: any };
    return {
      ...rest,
      employer_id: rest.company_id,
      employer: company ?? null,
      created_by: toApiCreatedBy(rest.created_by),
    };
  }) as any;
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

  if (shift.status === ShiftStatus.completed || shift.status === ShiftStatus.cancelled) {
    throw new AppError(
      400,
      'INVALID_STATE',
      `Cannot cancel a shift that is already ${shift.status}.`,
    );
  }

  if (userType === ROLES.USER) {
    if (shift.original_employee_id !== userId) {
      throw new AppError(403, 'UNAUTHORIZED', 'Only the shift creator can cancel this shift.');
    }
  } else if (userType === ROLES.EMPLOYER) {
    if (shift.company_id !== userId) {
      throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to cancel this shift.');
    }
  }

  const cancelledShift = await prisma.$transaction(async (tx) => {
    const updatedShift = await tx.shift.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.cancelled,
      },
    });

    await tx.shiftApplication.updateMany({
      where: {
        shift_id: shiftId,
        status: ShiftApplicationStatus.pending,
      },
      data: {
        status: ShiftApplicationStatus.rejected,
      },
    });

    return updatedShift;
  });

  return cancelledShift;
};

// B4. Update Shift
export const updateShiftService = async (
  userId: string,
  userType: 'user' | 'employer',
  payload: UpdateShiftPayload,
): Promise<Shift> => {
  const shift = await prisma.shift.findUnique({
    where: {
      id: payload.shift_id,
    },
  });

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }

  if (shift.status !== ShiftStatus.open) {
    throw new AppError(400, 'UPDATE_FORBIDDEN', 'Cannot update a shift that is no longer open.');
  }

  if (userType === ROLES.USER && shift.original_employee_id !== userId) {
    throw new AppError(403, 'UNAUTHORIZED', 'Only the creator can update this shift.');
  }

  if (userType === ROLES.EMPLOYER && shift.company_id !== userId) {
    throw new AppError(403, 'UNAUTHORIZED', 'Only the employer who owns this shift can update it.');
  }

  if (
    payload.replacement_employee_id &&
    payload.replacement_employee_id === shift.original_employee_id
  ) {
    throw new AppError(
      400,
      'SELF_SHIFT_NOT_ALLOWED',
      'You cannot assign a shift to the original employee.',
    );
  }

  if (payload.replacement_employee_id) {
    const replacementEmployee = await prisma.user.findUnique({
      where: { id: payload.replacement_employee_id },
      select: { id: true },
    });
    if (!replacementEmployee) {
      throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Replacement employee not found.');
    }
  }

  const oldReplacementEmployeeId = shift.replacement_employee_id;
  const newReplacementEmployeeId = payload.replacement_employee_id ?? shift.replacement_employee_id;

  const updatedShift = await prisma.$transaction(async (tx) => {
    const updated = await tx.shift.update({
      where: {
        id: payload.shift_id,
      },
      data: {
        shift_date: payload.shift_date ? new Date(payload.shift_date) : undefined,

        shift_start: payload.shift_start ? new Date(payload.shift_start) : undefined,

        shift_end: payload.shift_end ? new Date(payload.shift_end) : undefined,

        skill_required: payload.skill_required,

        replacement_employee_id:
          payload.replacement_employee_id !== undefined
            ? payload.replacement_employee_id
            : undefined,
      },
    });

    const replacementChanged = oldReplacementEmployeeId !== payload.replacement_employee_id;

    if (!replacementChanged) {
      return updated;
    }

    /*
      OLD INVITEE EXISTS
      Reject their application + clear notification
    */
    if (oldReplacementEmployeeId) {
      await tx.shiftApplication.updateMany({
        where: {
          shift_id: shift.id,
          user_id: oldReplacementEmployeeId,
        },
        data: {
          status: ShiftApplicationStatus.rejected,
        },
      });

      await tx.notification.updateMany({
        where: {
          user_id: oldReplacementEmployeeId,
          type: NotificationTypes.shiftSwapRequest,
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

    /*
      PUBLIC -> PRIVATE
      Reject everyone else
    */
    if (!oldReplacementEmployeeId && newReplacementEmployeeId) {
      await tx.shiftApplication.updateMany({
        where: {
          shift_id: shift.id,
          status: ShiftApplicationStatus.pending,
        },
        data: {
          status: ShiftApplicationStatus.rejected,
        },
      });
    }

    /*
      PRIVATE -> PUBLIC
      Broadcast again
    */
    if (oldReplacementEmployeeId && !payload.replacement_employee_id) {
      await publicShiftQueue.add('broadcast-public-shift', {
        shiftId: shift.id,
        employerId: shift.company_id,
        originalEmployeeId: shift.original_employee_id,
        skillRequired: payload.skill_required ?? shift.skill_required,
      });
    }

    /*
      PRIVATE -> PRIVATE
      OR
      PUBLIC -> PRIVATE
    */
    if (newReplacementEmployeeId) {
      await tx.shiftApplication.upsert({
        where: {
          shift_id_user_id: {
            shift_id: shift.id,
            user_id: newReplacementEmployeeId,
          },
        },

        update: {
          status: ShiftApplicationStatus.pending,
          type: ShiftApplicationType.invited,
        },

        create: {
          shift_id: shift.id,
          user_id: newReplacementEmployeeId,
          type: ShiftApplicationType.invited,
          status: ShiftApplicationStatus.pending,
        },
      });

      await createNotificationService({
        userId: newReplacementEmployeeId,
        type: NotificationTypes.shiftSwapRequest,
        title: 'New Shift Swap Request',
        body: 'You received a shift swap request.',
        data: {
          type: NotificationTypes.shiftSwapRequest,
          shiftId: shift.id,
          employerId: shift.company_id,
          originalEmployeeId: shift.original_employee_id,
          replacementEmployeeId: newReplacementEmployeeId,
        },
      });
    }

    return updated;
  });

  return updatedShift;
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

  const shiftApplication = await prisma.shiftApplication.findUnique({
    where: {
      shift_id_user_id: {
        shift_id: shift.id,
        user_id: workerId,
      },
    },
  });

  if (!shiftApplication) {
    throw new AppError(404, 'SHIFT_APPLICATION_NOT_FOUND', 'Shift application not found.');
  }

  if (shift.status !== ShiftStatus.open) {
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

  if (shiftApplication.status !== ShiftApplicationStatus.pending) {
    throw new AppError(400, 'APPLICATION_NOT_PENDING', 'This request has already been processed.');
  }

  if (shiftApplication.type !== ShiftApplicationType.invited) {
    throw new AppError(
      400,
      'INVALID_APPLICATION_TYPE',
      'Only invited shift requests can be accepted.',
    );
  }
  await prisma.notification.updateMany({
    where: {
      type: NotificationTypes.shiftSwapRequest,
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

  await prisma.shiftApplication.update({
    where: {
      shift_id_user_id: {
        shift_id: shift.id,
        user_id: workerId,
      },
    },
    data: {
      status:
        shift.created_by === PlatformType.EMPLOYER
          ? ShiftApplicationStatus.accepted
          : ShiftApplicationStatus.pending,
    },
  });

  const updatedShift = await prisma.shift.update({
    where: { id: payload.shift_id },
    data: {
      replacement_employee_id: workerId,
      request_accepted: true,
      status: shift.created_by === PlatformType.EMPLOYER ? ShiftStatus.approved : ShiftStatus.open, // Update status to reflect it has been accepted
    },
  });

  return updatedShift;
};

// A1.Apply for public shifts
export const applyForPublicShiftsService = async (
  workerId: string,
  payload: ApplyForPublicShiftPayload,
): Promise<ApplyForPublicShiftResponse> => {
  const shift = await prisma.shift.findUnique({
    where: {
      id: payload.shift_id,
    },
  });

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }

  if (shift.status !== ShiftStatus.open) {
    throw new AppError(400, 'SHIFT_NOT_OPEN', 'This shift is no longer accepting applications.');
  }

  if (shift.original_employee_id === workerId) {
    throw new AppError(400, 'SELF_APPLY_ERROR', 'You cannot apply to your own shift.');
  }

  // Public shifts only
  if (shift.replacement_employee_id) {
    throw new AppError(400, 'NOT_PUBLIC_SHIFT', 'This shift is assigned to a specific employee.');
  }

  const existingApplication = await prisma.shiftApplication.findUnique({
    where: {
      shift_id_user_id: {
        shift_id: shift.id,
        user_id: workerId,
      },
    },
  });

  /*
    Existing active application
  */
  if (existingApplication && existingApplication.status !== ShiftApplicationStatus.withdrawn) {
    throw new AppError(409, 'ALREADY_APPLIED', 'You have already applied for this shift.');
  }

  await prisma.notification.updateMany({
    where: {
      user_id: workerId,
      type: NotificationTypes.publicShiftSwap,
      data: {
        path: ['shiftId'],
        equals: shift.id,
      },
    },

    data: {
      isRead: true,
    },
  });

  /*
    Re-apply after withdrawal
  */
  if (existingApplication && existingApplication.status === ShiftApplicationStatus.withdrawn) {
    return prisma.shiftApplication.update({
      where: {
        shift_id_user_id: {
          shift_id: shift.id,
          user_id: workerId,
        },
      },

      data: {
        type: ShiftApplicationType.applied,
        status: ShiftApplicationStatus.pending,
      },
    });
  }

  /*
    First-time application
  */
  return prisma.shiftApplication.create({
    data: {
      shift_id: shift.id,
      user_id: workerId,
      type: ShiftApplicationType.applied,
      status: ShiftApplicationStatus.pending,
    },
  });
};

export const syncSavedShiftsService = async (
  userId: string,
  shiftIds: string[],
): Promise<GetEmployeeShiftsResponse> => {
  if (!shiftIds || shiftIds.length === 0) {
    return [];
  }

  const shifts = await prisma.shift.findMany({
    where: {
      id: {
        in: shiftIds,
      },
    },
    include: {
      company: companyAsEmployerInclude,
      original_employee: {
        select: safeUserSelect,
      },
      shiftApplications: {
        where: {
          user_id: userId,
        },
        take: 1,
      },
    },
  });

  const transformedShifts = shifts.map(({ shiftApplications, ...shift }) =>
    mapShiftWithCompanyToApi({
      ...shift,
      shiftApplication: shiftApplications[0] ?? null,
    }),
  );

  return transformedShifts as GetEmployeeShiftsResponse;
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
    `s.shift_start > NOW()`,
  ];

  const values: any[] = [];
  let paramIndex = 1;

  /*
    Nearby filter
  */
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

  values.push(longitude, latitude, radius * 1000);

  paramIndex += 3;

  /*
    Don't show own shifts
  */
  conditions.push(`
    s.original_employee_id != $${paramIndex}
  `);

  values.push(userId);

  paramIndex++;

  /*
    Hide shifts already applied to / accepted / rejected
    Allow withdrawn users to see them again
  */
  conditions.push(`
    NOT EXISTS (
      SELECT 1
      FROM shift_applications sa
      WHERE sa.shift_id = s.id
        AND sa.user_id = $${paramIndex}
        AND sa.status IN (
          'pending',
          'accepted',
          'rejected'
        )
    )
  `);

  values.push(userId);

  paramIndex++;

  /*
    Skill filter
  */
  if (skill) {
    conditions.push(`
      s.skill_required ILIKE $${paramIndex}
    `);

    values.push(`%${skill}%`);

    paramIndex++;
  }

  /*
    Date filter
  */
  if (date) {
    conditions.push(`
      s.shift_date >= $${paramIndex}
    `);

    values.push(new Date(date));

    paramIndex++;
  }

  /*
    Pagination
  */
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

    INNER JOIN companies e
      ON s.company_id = e.id

    WHERE ${conditions.join(' AND ')}

    ORDER BY s.shift_date ASC

    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
    `,
    ...values,
  );

  return (shifts as any[]).map((s) => ({
    ...s,
    employer_id: s.company_id ?? s.employer_id,
    created_by: s.created_by != null ? toApiCreatedBy(s.created_by) : s.created_by,
  })) as GetExtraShiftsResponse;
};

// D. Rate Employee/Employer
export const rateShiftService = async (
  raterId: string,
  raterType: 'user' | 'employer',
  payload: RateShiftPayload,
): Promise<Rating> => {
  const shift = await prisma.shift.findUnique({
    where: {
      id: payload.shift_id,
    },
  });

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }

  if (shift.status === ShiftStatus.open || shift.status === ShiftStatus.cancelled) {
    throw new AppError(400, 'INVALID_STATE', 'Cannot rate a shift that is open or cancelled.');
  }

  if (!shift.replacement_employee_id) {
    throw new AppError(
      400,
      'NO_REPLACEMENT_WORKER',
      'This shift never had a replacement employee.',
    );
  }

  const participants = [shift.original_employee_id, shift.replacement_employee_id];

  /*
   * User being rated must have participated
   */
  if (!participants.includes(payload.user_id)) {
    throw new AppError(400, 'INVALID_TARGET', 'This user did not participate in the shift.');
  }

  /*
   * User raters must have participated
   */
  if (raterType === ROLES.USER) {
    if (!participants.includes(raterId)) {
      throw new AppError(403, 'UNAUTHORIZED', 'You did not participate in this shift.');
    }

    if (payload.user_id === raterId) {
      throw new AppError(400, 'SELF_RATING_NOT_ALLOWED', 'You cannot rate yourself.');
    }
  }

  /*
   * Employer must own the shift
   */
  if (raterType === ROLES.EMPLOYER) {
    if (shift.company_id !== raterId) {
      throw new AppError(403, 'UNAUTHORIZED', 'You do not own this shift.');
    }
  }

  /*
   * Duplicate rating check — unique on (shift_id, from_user_id, to_user_id)
   */
  let fromUserId = raterId;
  if (raterType === ROLES.EMPLOYER) {
    const owner = await prisma.companyMember.findFirst({
      where: {
        company_id: raterId,
        platform_type: PlatformType.EMPLOYER,
        role: { code: 'OWNER' },
      },
    });
    if (!owner?.user_id) {
      throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer owner not found.');
    }
    fromUserId = owner.user_id;
  }

  const existingRating = await prisma.rating.findFirst({
    where: {
      shift_id: payload.shift_id,
      from_user_id: fromUserId,
      to_user_id: payload.user_id,
    },
  });

  if (existingRating) {
    throw new AppError(409, 'ALREADY_RATED', 'You have already rated this user for this shift.');
  }

  const rating = await prisma.rating.create({
    data: {
      shift_id: payload.shift_id,
      from_user_id: fromUserId,
      to_user_id: payload.user_id,
      company_id: raterType === ROLES.EMPLOYER ? raterId : shift.company_id,
      score: payload.score,
      review: payload.review,
      flagged_issue: payload.flagged_issue,
    },
  });
  if (payload.is_absent) {
    await prisma.shift.update({
      where: { id: payload.shift_id },
      data: {
        status: ShiftStatus.absent,
        no_show_reported: true,
      },
    });
  }
  return rating;
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
    },
  });
  if (!employee) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found.');
  }
  return {
    id: employee.id,
  };
};

// F. Get Open shifts for employee
export const getOpenShiftsForEmployeeService = async (
  userId: string,
): Promise<GetOpenShiftsForEmployeeResponse> => {
  /*
    1. Specific shift invitations
    Source of truth = ShiftApplication
  */
  const invitedApplications = await prisma.shiftApplication.findMany({
    where: {
      user_id: userId,
      type: ShiftApplicationType.invited,
      status: ShiftApplicationStatus.pending,

      shift: {
        status: ShiftStatus.open,

        shift_start: {
          gt: new Date(),
        },
      },
    },

    include: {
      shift: {
        include: {
          original_employee: {
            select: safeUserSelect,
          },

          company: companyAsEmployerInclude,
        },
      },
    },
  });

  const requestedSpecificShifts = invitedApplications.map((application) => {
    const { shift, ...shiftApp } = application;
    return mapShiftWithCompanyToApi({
      ...shift,
      shiftApplication: shiftApp,
    });
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
      const data = notification.data as {
        shiftId?: string;
      };

      if (!data?.shiftId) {
        return null;
      }

      notificationMap.set(data.shiftId, notification.id);

      return data.shiftId;
    })
    .filter((shiftId): shiftId is string => Boolean(shiftId));

  /*
    4. Fetch public shifts

    Exclude shifts where the user already:
    - applied
    - accepted
    - rejected

    Allow withdrawn users to see again
  */
  const publicShifts =
    publicShiftIds.length > 0
      ? await prisma.shift.findMany({
          where: {
            id: {
              in: publicShiftIds,
            },

            status: ShiftStatus.open,

            replacement_employee_id: null,

            shift_start: {
              gt: new Date(),
            },

            shiftApplications: {
              none: {
                user_id: userId,

                status: {
                  in: [
                    ShiftApplicationStatus.pending,
                    ShiftApplicationStatus.accepted,
                    ShiftApplicationStatus.rejected,
                  ],
                },
              },
            },
          },

          include: {
            original_employee: {
              select: safeUserSelect,
            },

            company: companyAsEmployerInclude,

            shiftApplications: {
              where: {
                user_id: userId,
              },
              take: 1,
            },
          },
        })
      : [];

  /*
    5. Attach notificationId to public shifts
  */
  const publicShiftsWithNotificationId = publicShifts.map(({ shiftApplications, ...shift }) =>
    mapShiftWithCompanyToApi({
      ...shift,
      notificationId: notificationMap.get(shift.id) ?? null,
      shiftApplication: shiftApplications[0] ?? null,
    }),
  );

  /*
    6. Merge + remove duplicates
  */
  const uniqueShiftsMap = new Map<string, ShiftWithNotification>();

  requestedSpecificShifts.forEach((shift) => {
    uniqueShiftsMap.set(shift.id, shift as ShiftWithNotification);
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
): Promise<{ shifts: ShiftWithDistance[]; meta: Record<string, number> }> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  /*
    1. Fetch user's location
  */
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
    throw new AppError(
      400,
      'LOCATION_NOT_SET',
      'User location is not set. Cannot calculate distance.',
    );
  }

  const { latitude, longitude } = user;

  /*
    2. Fetch latest public shifts within 10 km
  */
  const [shifts, totalResult] = await Promise.all([
    prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        s.*,

        json_build_object(
          'company_name', e.company_name,
          'company_address', e.company_address,
          'is_verified', e.is_verified
        ) AS employer,

        ROUND(
          (
            ST_Distance(
              e.company_location,
              ST_SetSRID(
                ST_MakePoint($1, $2),
                4326
              )::geography
            ) / 1000
          )::numeric,
          1
        ) AS distance_in_km

      FROM shifts s

      INNER JOIN companies e
        ON s.company_id = e.id

      WHERE
        s.status = 'open'
        AND s.request_accepted = false
        AND s.replacement_employee_id IS NULL
        AND s.original_employee_id != $3
        AND e.company_location IS NOT NULL
        AND s.shift_start > NOW()

        -- Within 10000 KM radius
        AND ST_DWithin(
          e.company_location,
          ST_SetSRID(
            ST_MakePoint($1, $2),
            4326
          )::geography,
          10000000
        )

        -- Hide shifts already interacted with
        AND NOT EXISTS (
          SELECT 1
          FROM shift_applications sa
          WHERE sa.shift_id = s.id
            AND sa.user_id = $4
            AND sa.status IN (
              'pending',
              'accepted',
              'rejected'
            )
        )

      ORDER BY s.created_at DESC

      LIMIT $5
      OFFSET $6
      `,
      longitude, // $1
      latitude, // $2
      userId, // $3
      userId, // $4
      limit, // $5
      skip, // $6
    ),
    prisma.$queryRawUnsafe<any[]>(
      `
      SELECT COUNT(*) as count
      FROM shifts s
      INNER JOIN companies e
        ON s.company_id = e.id
      WHERE
        s.status = 'open'
        AND s.request_accepted = false
        AND s.replacement_employee_id IS NULL
        AND s.original_employee_id != $3
        AND e.company_location IS NOT NULL
        AND s.shift_start > NOW()
        AND ST_DWithin(
          e.company_location,
          ST_SetSRID(
            ST_MakePoint($1, $2),
            4326
          )::geography,
          10000000
        )
        AND NOT EXISTS (
          SELECT 1
          FROM shift_applications sa
          WHERE sa.shift_id = s.id
            AND sa.user_id = $4
            AND sa.status IN (
              'pending',
              'accepted',
              'rejected'
            )
        )
      `,
      longitude, // $1
      latitude, // $2
      userId, // $3
      userId, // $4
    ),
  ]);

  const total = Number(totalResult[0]?.count || 0);

  return {
    shifts: (shifts as any[]).map((s) => ({
      ...s,
      employer_id: s.company_id ?? s.employer_id,
      created_by: s.created_by != null ? toApiCreatedBy(s.created_by) : s.created_by,
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  } ;
};

export const getBestShiftMatchesService = async (
  query: GetBestShiftMatchesQuery,
  userId: string,
): Promise<{ shifts: ShiftWithDistance[]; meta: Record<string, number> }> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

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
    throw new AppError(
      400,
      'LOCATION_NOT_SET',
      'User location is not set. Cannot calculate matches.',
    );
  }

  const { latitude, longitude } = user;

  const userSkills = user.skills && user.skills.length > 0 ? user.skills : [];

  if (userSkills.length === 0) {
    return {
      shifts: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  const normalizedSkills = userSkills.map((skill: string) => skill.toLowerCase());

  const [shifts, totalResult] = await Promise.all([
    prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        s.*,

        json_build_object(
          'company_name', e.company_name,
          'company_address', e.company_address,
          'is_verified', e.is_verified
        ) AS employer,

        ROUND(
          (
            ST_Distance(
              e.company_location,
              ST_SetSRID(
                ST_MakePoint($1, $2),
                4326
              )::geography
            ) / 1000
          )::numeric,
          1
        ) AS distance_in_km

      FROM shifts s

      INNER JOIN companies e
        ON s.company_id = e.id

      WHERE
        s.status = 'open'
        AND s.request_accepted = false
        AND s.replacement_employee_id IS NULL
        AND s.original_employee_id != $3
        AND e.company_location IS NOT NULL
        AND s.shift_start > NOW()

        AND LOWER(s.skill_required) = ANY($6::text[])

        AND ST_DWithin(
          e.company_location,
          ST_SetSRID(
            ST_MakePoint($1, $2),
            4326
          )::geography,
          10000
        )

        AND NOT EXISTS (
          SELECT 1
          FROM shift_applications sa
          WHERE sa.shift_id = s.id
            AND sa.user_id = $7
            AND sa.status IN (
              'pending',
              'accepted',
              'rejected'
            )
        )

      ORDER BY
        distance_in_km ASC,
        s.shift_date ASC

      LIMIT $4
      OFFSET $5
      `,
      longitude, // $1
      latitude, // $2
      userId, // $3
      limit, // $4
      skip, // $5
      normalizedSkills, // $6
      userId, // $7
    ),
    prisma.$queryRawUnsafe<any[]>(
      `
      SELECT COUNT(*) as count
      FROM shifts s
      INNER JOIN companies e
        ON s.company_id = e.id
      WHERE
        s.status = 'open'
        AND s.request_accepted = false
        AND s.replacement_employee_id IS NULL
        AND s.original_employee_id != $3
        AND e.company_location IS NOT NULL
        AND s.shift_start > NOW()
        AND LOWER(s.skill_required) = ANY($4::text[])
        AND ST_DWithin(
          e.company_location,
          ST_SetSRID(
            ST_MakePoint($1, $2),
            4326
          )::geography,
          10000
        )
        AND NOT EXISTS (
          SELECT 1
          FROM shift_applications sa
          WHERE sa.shift_id = s.id
            AND sa.user_id = $5
            AND sa.status IN (
              'pending',
              'accepted',
              'rejected'
            )
        )
      `,
      longitude, // $1
      latitude, // $2
      userId, // $3
      normalizedSkills, // $4
      userId, // $5
    ),
  ]);

  const total = Number(totalResult[0]?.count || 0);

  return {
    shifts: (shifts as any[]).map((s) => ({
      ...s,
      employer_id: s.company_id ?? s.employer_id,
      created_by: s.created_by != null ? toApiCreatedBy(s.created_by) : s.created_by,
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  } ;
};

export const getEmployerShiftAnalyticsService = async (
  employerId: string,
): Promise<GetEmployerShiftAnalyticsResponse> => {
  const [
    totalShifts,
    openShifts,
    approvedShifts,
    completedShifts,
    cancelledShifts,
    totalApplications,
    pendingApplications,
  ] = await Promise.all([
    prisma.shift.count({ where: { company_id: employerId } }),
    prisma.shift.count({ where: { company_id: employerId, status: ShiftStatus.open } }),
    prisma.shift.count({ where: { company_id: employerId, status: ShiftStatus.approved } }),
    prisma.shift.count({ where: { company_id: employerId, status: ShiftStatus.completed } }),
    prisma.shift.count({ where: { company_id: employerId, status: ShiftStatus.cancelled } }),
    prisma.shiftApplication.count({ where: { shift: { company_id: employerId } } }),
    prisma.shiftApplication.count({
      where: { shift: { company_id: employerId }, status: ShiftApplicationStatus.pending },
    }),
  ]);

  return {
    totalShifts,
    openShifts,
    approvedShifts,
    completedShifts,
    cancelledShifts,
    totalApplications,
    pendingApplications,
  };
};

export const getPendingShiftsForEmployerService = async (
  employerId: string,
  query: GetPendingShiftsQuery,
): Promise<{ pendingApplications: GetPendingShiftsResponse; meta: Record<string, number> }> => {
  const { limit = 10, page = 1, shift_id } = query;
  const skip = (page - 1) * limit;

  const whereClause = {
    status: ShiftApplicationStatus.pending,
    shift: {
      ...(shift_id && { id: shift_id }),
      company_id: employerId,
      status: ShiftStatus.open,
      organization_approved: false,
      shift_start: {
        gt: new Date(),
      },
    },
  };

  const [pendingApplications, total] = await Promise.all([
    prisma.shiftApplication.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            phone_no: true,
          },
        },
        shift: {
          include: {
            original_employee: {
              select: {
                name: true,
                phone_no: true,
              },
            },
            company: companyAsEmployerInclude,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
      take: limit,
      skip,
    }),
    prisma.shiftApplication.count({ where: whereClause }),
  ]);

  return {
    pendingApplications: pendingApplications.map((app) => ({
      ...app,
      shift: mapShiftWithCompanyToApi(app.shift),
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const rejectShiftApplicationService = async (
  employerId: string,
  shiftApplicationId: string,
): Promise<RejectShiftResponse> => {
  const shiftApplication = await prisma.shiftApplication.findUnique({
    where: {
      id: shiftApplicationId,
    },

    include: {
      shift: true,
    },
  });

  if (!shiftApplication) {
    throw new AppError(404, 'SHIFT_APPLICATION_NOT_FOUND', 'Shift application not found.');
  }

  const shift = shiftApplication.shift;

  if (shift.company_id !== employerId) {
    throw new AppError(
      403,
      'UNAUTHORIZED',
      'You do not have permission to reject this application.',
    );
  }

  if (shift.status !== ShiftStatus.open) {
    throw new AppError(400, 'INVALID_SHIFT_STATE', 'This shift can no longer be reviewed.');
  }

  const isEmployeeCreatedPrivateInvite =
    shift.created_by === PlatformType.EMPLOYEE && shiftApplication.type === ShiftApplicationType.invited;

  const updatedApplication = await prisma.$transaction(async (tx) => {
    const application = await tx.shiftApplication.update({
      where: {
        id: shiftApplicationId,
      },

      data: {
        status: ShiftApplicationStatus.rejected,
      },
    });

    await tx.shift.update({
      where: {
        id: shift.id,
      },

      data: {
        replacement_employee_id: isEmployeeCreatedPrivateInvite
          ? shift.replacement_employee_id
          : null,
        request_accepted: shiftApplication.type === ShiftApplicationType.invited ? true : false,
        organization_approved: false,
        status:
          shiftApplication.type === ShiftApplicationType.invited
            ? ShiftStatus.rejected
            : ShiftStatus.open,
      },
    });

    return application;
  });

  return updatedApplication;
};

export const getShiftDetailsService = async (
  userId: string,
  userType: 'user' | 'employer',
  shiftId: string,
  query: GetShiftDetailsQuery,
): Promise<{ shift: GetShiftDetailsResponse; meta: Record<string, number> }> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const [shift, totalApplications] = await Promise.all([
    prisma.shift.findUnique({
      where: {
        id: shiftId,
      },
      include: {
        original_employee: {
          select: safeUserSelect,
        },
        replacement_employee: {
          select: safeUserSelect,
        },
        company: companyAsEmployerInclude,
        shiftApplications: {
          include: {
            user: {
              select: safeUserSelect,
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: limit,
          skip,
        },
      },
    }),
    prisma.shiftApplication.count({
      where: {
        shift_id: shiftId,
      },
    }),
  ]);

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Shift not found.');
  }

  /*
    Employer authorization
  */
  if (userType === ROLES.EMPLOYER && shift.company_id !== userId) {
    throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to view this shift.');
  }

  /*
    Employee authorization
  */
  if (userType === ROLES.USER) {
    const isOriginalEmployee = shift.original_employee_id === userId;

    const isSelectedReplacement = shift.replacement_employee_id === userId;

    const isPublicOpenShift =
      shift.replacement_employee_id === null && shift.status === ShiftStatus.open;

    let isApplicant = false;
    if (!isOriginalEmployee && !isSelectedReplacement && !isPublicOpenShift) {
      const userApplicationCount = await prisma.shiftApplication.count({
        where: { shift_id: shiftId, user_id: userId },
      });
      isApplicant = userApplicationCount > 0;
    }

    if (!isOriginalEmployee && !isSelectedReplacement && !isApplicant && !isPublicOpenShift) {
      throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to view this shift.');
    }
  }

  return {
    shift: mapShiftWithCompanyToApi(shift),
    meta: {
      total: totalApplications,
      page,
      limit,
      totalPages: Math.ceil(totalApplications / limit),
    },
  };
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

  if (shift.company_id !== employerId) {
    throw new AppError(403, 'UNAUTHORIZED', 'You do not have permission to modify this shift.');
  }

  if (shift.shift_end.getTime() > Date.now()) {
    throw new AppError(
      400,
      'SHIFT_NOT_COMPLETED',
      'Cannot mark shift compelete when its not over.',
    );
  }

  if (shift.status !== ShiftStatus.approved) {
    throw new AppError(
      400,
      'INVALID_SHIFT_STATE',
      'Only approved shifts can be marked as completed.',
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
  if (shift.company_id !== employerId) {
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
  if (shift.shift_start.getTime() > Date.now()) {
    throw new AppError(
      400,
      'SHIFT_NOT_STARTED',
      'Cannot report a no-show before the shift has started.',
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

const generateSeoTitle = (shift: any) => {
  let location = 'India';
  if (shift.employer?.company_address) {
    const parts = shift.employer.company_address.split(',').map((s: string) => s.trim());
    location = parts.pop() || 'India';
  }
  const pay = shift.shift_pay ? shift.shift_pay.toString() : '0';
  return `${shift.skill_required} Shift Swap in ${location} | ₹${pay} | KaamBadlo`;
};

export const getPublicShiftsService = async (
  query: GetPublicShiftsQuery,
): Promise<{ shifts: GetPublicShiftsResponse; meta: Record<string, number> }> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    status: ShiftStatus.open,
    replacement_employee_id: null,
  };

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where: whereClause,
      include: {
        company: { select: { company_name: true, company_address: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.shift.count({ where: whereClause }),
  ]);

  const shiftsWithTitle = shifts.map((shift) => {
    const mapped = mapShiftWithCompanyToApi(shift);
    return {
      ...mapped,
      seo_title: generateSeoTitle(shift),
    };
  });

  return {
    shifts: shiftsWithTitle as GetPublicShiftsResponse,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPublicShiftDetailsService = async (
  id: string,
): Promise<GetPublicShiftDetailsResponse> => {
  const shift = await prisma.shift.findUnique({
    where: { id, status: ShiftStatus.open, replacement_employee_id: null },
    include: {
      company: { select: { company_name: true, company_address: true } },
    },
  });

  if (!shift) {
    throw new AppError(404, 'SHIFT_NOT_FOUND', 'Public shift not found or no longer available.');
  }

  const shiftWithTitle = {
    ...mapShiftWithCompanyToApi(shift),
    seo_title: generateSeoTitle(shift),
  };

  return shiftWithTitle as GetPublicShiftDetailsResponse;
};
