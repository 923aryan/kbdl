import {
  EmploymentStatus,
  OnboardingStage,
  PlatformType,
  SYSTEM_ROLE_CODES,
  ensureDefaultCompanyRoles,
  prisma,
  safeUserSelect,
} from '@repo/db/server';
import {
  EmployeeEmploymentDTO,
  EmployeeOrgContext,
  GetAllEmployeeEmploymentQuery,
  GetAllEmployeeEmploymentResponse,
  GetEmployeeEmploymentResponse,
  GetEmployeePendingEmploymentResponse,
  GetEmployeePendingEmploymentsQuery,
  GetEmployerDepartmentsMetaQuery,
  GetEmployerDesignationsMetaQuery,
  GetEmployerRosterQuery,
  GetEmployerSupervisorsMetaQuery,
  GetEmployerWorkShiftsMetaQuery,
  MetaDepartmentItem,
  MetaDesignationItem,
  MetaSupervisorItem,
  MetaWorkShiftItem,
  OnboardEmployeePayload,
  SearchAddressResponse,
  UpdateEmploymentStatusPayload,
} from '@repo/types';
import {
  companyAsEmployerInclude,
  mapEmploymentToApi,
} from '../compat/employer-compat';
import { GEOAPIFY_CONFIG } from '../config/geoapify';
import { createNotificationService } from '../notifications/notification-service';
import { AppError } from '../utils/api-error';
import { NotificationTypes } from '../utils/constants';
import {
  mapEmploymentStatusToUi,
  resolveOnboardingStageFromDocs,
} from './employment-status-map';

const withEmployerId = <T extends { company_id: string }>(row: T): T & { employer_id: string } => ({
  ...row,
  employer_id: row.company_id,
});

const hrProfileInclude = {
  designation: { select: { id: true, name: true } },
} as const;

async function loadOrganizationContext(
  companyId: string,
  employeeUserId: string,
  designation: { id: string; name: string } | null | undefined,
): Promise<EmployeeOrgContext> {
  const member = await prisma.companyMember.findFirst({
    where: { company_id: companyId, user_id: employeeUserId },
    select: {
      department: { select: { id: true, name: true } },
      manager: {
        select: {
          id: true,
          user_id: true,
          user: { select: { name: true, phone_no: true } },
        },
      },
      employee_shifts: {
        where: { effective_to: null },
        orderBy: { effective_from: 'desc' },
        take: 1,
        select: {
          work_shift: { select: { id: true, name: true } },
        },
      },
    },
  });

  const currentShift = member?.employee_shifts[0]?.work_shift ?? null;

  return {
    designation: designation ?? null,
    department: member?.department ?? null,
    manager: member?.manager
      ? {
          id: member.manager.id,
          user_id: member.manager.user_id,
          name: member.manager.user.name,
          phone_no: member.manager.user.phone_no,
        }
      : null,
    work_shift: currentShift,
  };
}

async function toEmploymentDto(row: {
  id: string;
  company_id: string;
  employee_id: string;
  employment_status: EmploymentStatus;
  hr_profile?:
    | (EmployeeEmploymentDTO['hr_profile'] & {
        designation?: { id: string; name: string } | null;
        onboarding_stage?: OnboardingStage | null;
      })
    | null;
  employee: EmployeeEmploymentDTO['employee'];
  [key: string]: unknown;
}): Promise<EmployeeEmploymentDTO> {
  const organization = await loadOrganizationContext(
    row.company_id,
    row.employee_id,
    row.hr_profile?.designation ?? null,
  );

  const onboardingStage = row.hr_profile?.onboarding_stage ?? null;

  return {
    ...withEmployerId(row),
    organization,
    status: {
      employment_status: row.employment_status,
      onboarding_stage: onboardingStage,
      ui_status: mapEmploymentStatusToUi(row.employment_status, onboardingStage),
    },
  } as EmployeeEmploymentDTO;
}

export const getEmployerRosterService = async (
  employerId: string,
  query: GetEmployerRosterQuery,
): Promise<{ roster: EmployeeEmploymentDTO[]; meta: Record<string, number> }> => {
  const { status, search, limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    company_id: employerId,
  };

  if (status) {
    whereClause.employment_status = status;
  }

  if (search) {
    whereClause.employee = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone_no: { contains: search } },
        { karigari_id: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [roster, total] = await Promise.all([
    prisma.employeeEmployment.findMany({
      where: whereClause,
      include: {
        employee: { select: safeUserSelect },
        hr_profile: { include: hrProfileInclude },
      },
      orderBy: { joined_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.employeeEmployment.count({ where: whereClause }),
  ]);

  const enriched = await Promise.all(roster.map((row) => toEmploymentDto(row as any)));

  return {
    roster: enriched,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEmployeeDetailsService = async (
  employerId: string,
  mappingId: string,
): Promise<EmployeeEmploymentDTO> => {
  const employeeDetails = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      company_id: employerId,
    },
    include: {
      employee: { select: safeUserSelect },
      hr_profile: { include: hrProfileInclude },
    },
  });
  if (!employeeDetails) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee record not found or access denied');
  }
  return toEmploymentDto(employeeDetails as any);
};

const SUPERVISOR_ROLE_CODES = [
  SYSTEM_ROLE_CODES.OWNER,
  SYSTEM_ROLE_CODES.ADMIN,
  SYSTEM_ROLE_CODES.HR,
  SYSTEM_ROLE_CODES.MANAGER,
  SYSTEM_ROLE_CODES.TEAM_LEAD,
] as const;

const formatTimeOnly = (value: Date | string) => {
  if (typeof value === 'string') {
    // Prisma Time often serializes as ISO; keep HH:mm:ss when possible
    const match = value.match(/T(\d{2}:\d{2}:\d{2})/);
    if (match) return match[1]!;
    if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 8);
    return value;
  }
  return value.toISOString().slice(11, 19);
};

export const getEmployerDepartmentsMetaService = async (
  companyId: string,
  query: GetEmployerDepartmentsMetaQuery,
): Promise<{ items: MetaDepartmentItem[]; meta: Record<string, number> }> => {
  const { search, limit = 20, page = 1 } = query;
  const skip = (page - 1) * limit;
  const where = {
    company_id: companyId,
    ...(search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.department.findMany({
      where,
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
      take: limit,
      skip,
    }),
    prisma.department.count({ where }),
  ]);

  return {
    items: rows,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const getEmployerSupervisorsMetaService = async (
  companyId: string,
  query: GetEmployerSupervisorsMetaQuery,
): Promise<{ items: MetaSupervisorItem[]; meta: Record<string, number> }> => {
  const { search, limit = 20, page = 1 } = query;
  const skip = (page - 1) * limit;

  const where = {
    company_id: companyId,
    is_active: true,
    role: { code: { in: [...SUPERVISOR_ROLE_CODES] } },
    ...(search
      ? {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' as const } } },
            { user: { phone_no: { contains: search } } },
            { user: { karigari_id: { contains: search, mode: 'insensitive' as const } } },
            { role: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.companyMember.findMany({
      where,
      select: {
        id: true,
        user_id: true,
        department_id: true,
        user: { select: { name: true, phone_no: true } },
        role: { select: { code: true, name: true } },
        department: { select: { name: true } },
      },
      orderBy: [{ user: { name: 'asc' } }],
      take: limit,
      skip,
    }),
    prisma.companyMember.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.user.name,
      phone_no: row.user.phone_no,
      role_code: row.role.code,
      role_name: row.role.name,
      department_id: row.department_id,
      department_name: row.department?.name ?? null,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const getEmployerWorkShiftsMetaService = async (
  companyId: string,
  query: GetEmployerWorkShiftsMetaQuery,
): Promise<{ items: MetaWorkShiftItem[]; meta: Record<string, number> }> => {
  const { search, limit = 20, page = 1 } = query;
  const skip = (page - 1) * limit;
  const where = {
    company_id: companyId,
    is_active: true,
    ...(search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.workShift.findMany({
      where,
      select: {
        id: true,
        name: true,
        start_time: true,
        end_time: true,
        break_minutes: true,
        is_active: true,
      },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      take: limit,
      skip,
    }),
    prisma.workShift.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      start_time: formatTimeOnly(row.start_time),
      end_time: formatTimeOnly(row.end_time),
      break_minutes: row.break_minutes,
      is_active: row.is_active,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const getEmployerDesignationsMetaService = async (
  companyId: string,
  query: GetEmployerDesignationsMetaQuery,
): Promise<{ items: MetaDesignationItem[]; meta: Record<string, number> }> => {
  const { search, limit = 20, page = 1 } = query;
  const skip = (page - 1) * limit;
  const where = {
    company_id: companyId,
    is_active: true,
    ...(search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.companyDesignation.findMany({
      where,
      select: { id: true, name: true, description: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      take: limit,
      skip,
    }),
    prisma.companyDesignation.count({ where }),
  ]);

  return {
    items: rows,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const resolveOnboardingStage = (payload: OnboardEmployeePayload): OnboardingStage => {
  const identity = payload.identity;
  const hasFullIdentityDocs = Boolean(
    identity &&
      'aadhaar_number' in identity &&
      identity.aadhaar_number &&
      identity.pan_number &&
      identity.identity_document_url &&
      identity.additional_document_url,
  );

  return resolveOnboardingStageFromDocs({
    action: payload.action,
    hasFullIdentityDocs,
  });
};

const buildPaymentDetails = (payment: OnboardEmployeePayload['payment']) => {
  if (!payment?.method) return null;
  if (payment.method === 'upi') return payment.upi ?? null;
  if (payment.method === 'bank') return payment.bank ?? null;
  return null;
};

export const onboardEmployeeService = async (
  employerId: string,
  payload: OnboardEmployeePayload,
): Promise<EmployeeEmploymentDTO> => {
  const { phone_no, karigari_id, employee_no, action, personal, job, payment, identity, notes } =
    payload;

  if (employee_no) {
    const duplicateNo = await prisma.employeeEmployment.findFirst({
      where: { company_id: employerId, employee_no },
      select: { id: true },
    });
    if (duplicateNo) {
      throw new AppError(
        409,
        'EMPLOYEE_NO_EXISTS',
        'This employee_no is already used in your company.',
      );
    }
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [...(phone_no ? [{ phone_no }] : []), ...(karigari_id ? [{ karigari_id }] : [])],
    },
  });

  let createdUser = false;

  if (!user) {
    if (!phone_no) {
      throw new AppError(
        404,
        'WORKER_NOT_FOUND',
        'Worker not found. Provide phone_no to create a new employee, or a valid karigari_id.',
      );
    }

    const fullName = personal?.full_name?.trim();
    if (!fullName && action === 'submit') {
      throw new AppError(400, 'VALIDATION_ERROR', 'personal.full_name is required to create a user');
    }

    try {
      user = await prisma.user.create({
        data: {
          phone_no,
          name: fullName || null,
          email: personal?.email || null,
          karigari_id: karigari_id || null,
          experience:
            job?.experience_years !== undefined ? Math.floor(Number(job.experience_years)) : null,
          skills: job?.skill_trade ? [job.skill_trade] : [],
          default_address: personal?.address || null,
        },
      });
      createdUser = true;
    } catch {
      throw new AppError(
        409,
        'USER_CONFLICT',
        'Could not create user — phone or email may already exist.',
      );
    }
  } else if (personal?.full_name || personal?.email || personal?.address) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(personal.full_name ? { name: personal.full_name } : {}),
        ...(personal.email ? { email: personal.email } : {}),
        ...(personal.address ? { default_address: personal.address } : {}),
        ...(job?.skill_trade ? { skills: [job.skill_trade] } : {}),
        ...(job?.experience_years !== undefined
          ? { experience: Math.floor(Number(job.experience_years)) }
          : {}),
      },
    });
  }

  const existingEmployment = await prisma.employeeEmployment.findUnique({
    where: {
      company_id_employee_id: {
        company_id: employerId,
        employee_id: user.id,
      },
    },
  });

  if (existingEmployment) {
    throw new AppError(
      409,
      'ALREADY_ONBOARDED',
      'This worker is already onboarded to your company roster.',
    );
  }

  const onboardingStage = resolveOnboardingStage(payload);
  const joinedAt = job?.joining_date
    ? new Date(`${job.joining_date}T00:00:00.000Z`)
    : new Date();

  // New HR-created users become active; existing app users stay pending until they accept.
  const employmentStatus =
    createdUser && action === 'submit' ? EmploymentStatus.active : EmploymentStatus.pending;

  const roleMap = await ensureDefaultCompanyRoles(employerId);
  const employeeRoleId = roleMap[SYSTEM_ROLE_CODES.EMPLOYEE];

  // Resolve FK references (company-scoped) before write — IDs only, no name snapshots
  if (job?.designation_id) {
    const designation = await prisma.companyDesignation.findFirst({
      where: { id: job.designation_id, company_id: employerId, is_active: true },
      select: { id: true },
    });
    if (!designation) {
      throw new AppError(
        400,
        'INVALID_DESIGNATION',
        'designation_id is not valid for this company',
      );
    }
  }

  if (job?.department_id) {
    const department = await prisma.department.findFirst({
      where: { id: job.department_id, company_id: employerId },
      select: { id: true },
    });
    if (!department) {
      throw new AppError(400, 'INVALID_DEPARTMENT', 'department_id is not valid for this company');
    }
  }

  if (job?.reporting_supervisor_id) {
    const supervisor = await prisma.companyMember.findFirst({
      where: {
        id: job.reporting_supervisor_id,
        company_id: employerId,
        is_active: true,
        role: { code: { in: [...SUPERVISOR_ROLE_CODES] } },
      },
      select: {
        id: true,
        user_id: true,
      },
    });
    if (!supervisor) {
      throw new AppError(
        400,
        'INVALID_SUPERVISOR',
        'reporting_supervisor_id must be an active manager/lead in your company',
      );
    }
    if (supervisor.user_id === user.id) {
      throw new AppError(
        400,
        'INVALID_SUPERVISOR',
        'Employee cannot be their own reporting supervisor',
      );
    }
  }

  if (job?.work_shift_id) {
    const shift = await prisma.workShift.findFirst({
      where: { id: job.work_shift_id, company_id: employerId, is_active: true },
      select: { id: true },
    });
    if (!shift) {
      throw new AppError(400, 'INVALID_WORK_SHIFT', 'work_shift_id is not valid for this company');
    }
  }

  const employment = await prisma.$transaction(async (tx) => {
    const existingMember = await tx.companyMember.findUnique({
      where: { user_id: user!.id },
    });

    if (existingMember && existingMember.company_id !== employerId) {
      throw new AppError(
        409,
        'MEMBER_OTHER_COMPANY',
        'This user already belongs to another company and cannot be onboarded here.',
      );
    }

    let memberId = existingMember?.id;

    if (existingMember) {
      await tx.companyMember.update({
        where: { id: existingMember.id },
        data: {
          ...(job?.department_id ? { department_id: job.department_id } : {}),
          ...(job?.reporting_supervisor_id
            ? { manager_company_member_id: job.reporting_supervisor_id }
            : {}),
          is_active: true,
        },
      });
    } else if (employeeRoleId) {
      const createdMember = await tx.companyMember.create({
        data: {
          user_id: user!.id,
          company_id: employerId,
          role_id: employeeRoleId,
          platform_type: PlatformType.EMPLOYEE,
          is_active: true,
          department_id: job?.department_id || null,
          manager_company_member_id: job?.reporting_supervisor_id || null,
        },
      });
      memberId = createdMember.id;
    }

    if (memberId && job?.work_shift_id && job?.joining_date) {
      await tx.employeeShift.create({
        data: {
          company_id: employerId,
          company_member_id: memberId,
          work_shift_id: job.work_shift_id,
          effective_from: new Date(`${job.joining_date}T00:00:00.000Z`),
        },
      });
    } else if (memberId && job?.work_shift_id) {
      await tx.employeeShift.create({
        data: {
          company_id: employerId,
          company_member_id: memberId,
          work_shift_id: job.work_shift_id,
          effective_from: joinedAt,
        },
      });
    }

    const created = await tx.employeeEmployment.create({
      data: {
        company_id: employerId,
        employee_id: user!.id,
        employee_no: employee_no || null,
        employment_status: employmentStatus,
        joined_at: joinedAt,
        hr_profile: {
          create: {
            onboarding_stage: onboardingStage,
            full_name: personal?.full_name || user!.name || 'Employee',
            email: personal?.email || user!.email || null,
            date_of_birth: personal?.date_of_birth
              ? new Date(`${personal.date_of_birth}T00:00:00.000Z`)
              : null,
            gender: personal?.gender || null,
            address: personal?.address || null,
            blood_group: personal?.blood_group || null,
            emergency_contact_name: personal?.emergency_contact?.name || null,
            emergency_contact_relation: personal?.emergency_contact?.relation || null,
            emergency_contact_phone: personal?.emergency_contact?.phone_no || null,
            designation_id: job?.designation_id || null,
            branch_location: job?.branch_location || null,
            employee_type: job?.employee_type || null,
            work_location: job?.work_location || null,
            skill_trade: job?.skill_trade || null,
            experience_years:
              job?.experience_years !== undefined ? job.experience_years : null,
            certification_licenses: job?.certification_licenses || null,
            safety_training_completed: job?.safety_training_completed ?? null,
            payment_method: payment?.method || null,
            payment_details: buildPaymentDetails(payment) ?? undefined,
            basic_salary: payment?.basic_salary ?? null,
            salary_type: payment?.salary_type || null,
            salary_payment_frequency: payment?.payment_frequency || null,
            overtime_eligible: payment?.overtime_eligible ?? null,
            pf_applicable: payment?.pf_applicable ?? null,
            esi_applicable: payment?.esi_applicable ?? null,
            aadhaar_number: identity?.aadhaar_number || null,
            pan_number: identity?.pan_number || null,
            driving_license_number: identity?.driving_license_number || null,
            identity_document_url: identity?.identity_document_url || null,
            additional_document_url: identity?.additional_document_url || null,
            notes: notes || null,
          },
        },
      },
      include: {
        employee: { select: safeUserSelect },
        hr_profile: { include: hrProfileInclude },
      },
    });

    return created;
  });

  if (!createdUser) {
    await createNotificationService({
      userId: user.id,
      type: NotificationTypes.onboardRequest,
      title: 'New onboard request',
      body: 'You received an onboard request',
      data: {
        type: NotificationTypes.onboardRequest,
        employmentId: employment.id,
        employerId,
      },
    });
  }

  return toEmploymentDto(employment as any);
};

export const updateEmploymentStatusService = async (
  employerId: string,
  mappingId: string,
  payload: UpdateEmploymentStatusPayload,
): Promise<EmployeeEmploymentDTO> => {
  const { status } = payload;

  const existingRecord = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      company_id: employerId,
    },
  });

  if (!existingRecord) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee record not found or access denied');
  }

  const isLeaving = status === EmploymentStatus.terminated || status === EmploymentStatus.resigned;

  const updated = await prisma.employeeEmployment.update({
    where: {
      id: mappingId,
    },
    data: {
      employment_status: status,
      left_at: isLeaving ? new Date() : null,
    },
    include: {
      employee: { select: safeUserSelect },
      hr_profile: { include: hrProfileInclude },
    },
  });

  return toEmploymentDto(updated as any);
};

export const getAllEmployeeEmploymentService = async (
  employeeId: string,
  query: GetAllEmployeeEmploymentQuery,
): Promise<{ employments: GetAllEmployeeEmploymentResponse; meta: Record<string, number> }> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const whereClause = {
    employee_id: employeeId,
  };

  const [employments, total] = await Promise.all([
    prisma.employeeEmployment.findMany({
      where: whereClause,
      include: {
        company: companyAsEmployerInclude,
      },
      orderBy: { joined_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.employeeEmployment.count({ where: whereClause }),
  ]);

  return {
    employments: employments.map((e) => mapEmploymentToApi(e as any)) as GetAllEmployeeEmploymentResponse,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEmployeeEmploymentService = async (
  employeeId: string,
  mappingId: string,
): Promise<GetEmployeeEmploymentResponse> => {
  const employment = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      employee_id: employeeId,
    },
    include: {
      company: companyAsEmployerInclude,
    },
  });

  if (!employment) {
    throw new AppError(404, 'EMPLOYMENT_NOT_FOUND', 'Employment record not found or access denied');
  }

  return mapEmploymentToApi(employment as any) as GetEmployeeEmploymentResponse;
};

export const getEmployeePendingEmploymentsService = async (
  employeeId: string,
  query: GetEmployeePendingEmploymentsQuery,
): Promise<{ employments: GetEmployeePendingEmploymentResponse; meta: Record<string, number> }> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const whereClause = {
    employee_id: employeeId,
    employment_status: EmploymentStatus.pending,
  };

  const [employments, total] = await Promise.all([
    prisma.employeeEmployment.findMany({
      where: whereClause,
      include: {
        company: companyAsEmployerInclude,
      },
      orderBy: { joined_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.employeeEmployment.count({ where: whereClause }),
  ]);

  return {
    employments: employments.map((e) => mapEmploymentToApi(e as any)) as GetEmployeePendingEmploymentResponse,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const acceptEmploymentRequestService = async (
  employeeId: string,
  mappingId: string,
): Promise<GetEmployeeEmploymentResponse> => {
  const existingRecord = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      employee_id: employeeId,
      employment_status: EmploymentStatus.pending,
    },
  });

  if (!existingRecord) {
    throw new AppError(
      404,
      'EMPLOYMENT_NOT_FOUND',
      'Employment request not found or already processed',
    );
  }

  await prisma.employeeEmployment.updateMany({
    where: {
      employee_id: employeeId,
      employment_status: EmploymentStatus.active,
    },
    data: {
      employment_status: EmploymentStatus.resigned,
      left_at: new Date(),
    },
  });

  const employment = await prisma.employeeEmployment.update({
    where: { id: mappingId },
    data: { employment_status: EmploymentStatus.active },
    include: { company: companyAsEmployerInclude },
  });

  // User.employer_id removed in schema refactor; active employment is source of truth.
  return mapEmploymentToApi(employment as any) as GetEmployeeEmploymentResponse;
};

export const declineEmploymentRequestService = async (employeeId: string, mappingId: string) => {
  const existingRecord = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      employee_id: employeeId,
      employment_status: EmploymentStatus.pending,
    },
  });

  if (!existingRecord) {
    throw new AppError(
      404,
      'EMPLOYMENT_NOT_FOUND',
      'Employment request not found or already processed',
    );
  }

  return prisma.employeeEmployment.delete({
    where: { id: mappingId },
  });
};

export const getAddressSuggestionsService = async (
  query: string,
): Promise<SearchAddressResponse> => {
  const response = await fetch(
    `${GEOAPIFY_CONFIG.BASE_URL}/geocode/autocomplete?text=${encodeURIComponent(
      query,
    )}&filter=countrycode:in&limit=5&apiKey=${GEOAPIFY_CONFIG.API_KEY}`,
  );

  if (!response.ok) {
    throw new AppError(500, 'ADDRESS_LOOKUP_FAILED', 'Failed to retrieve address suggestions');
  }

  return response.json();
};
