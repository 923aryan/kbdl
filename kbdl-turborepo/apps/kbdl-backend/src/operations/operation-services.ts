import {
  OnboardingStage,
  PlatformType,
  Prisma,
  MaritalStatus,
  SeparationReason,
  SYSTEM_ROLE_CODES,
  ensureDefaultCompanyRoles,
  prisma,
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
import { upsertCompanyBranchByName } from './company-branch-helpers';
import {
  ACTIVE_EMPLOYMENT_FILTER,
  mapEmploymentStatusToUi,
  resolveOnboardingStageFromDocs,
} from './employment-status-map';
import {
  legacyAddressFromPresent,
  mapIdentityExtras,
  mapPersonalExtras,
  upsertHrAddresses,
  type AddressesInput,
} from './employee-profile-helpers';
import {
  enrichEmploymentWithProfileSections,
} from './profile-view-mapper';
import {
  buildEmployeeView,
  workforcePersonInclude,
} from './employment-dto-helpers';
import {
  employmentForAppUserWhere,
  findWorkforcePersonByPhoneOrKarigari,
  linkWorkforcePersonToUser,
} from './workforce-person-service';
import {
  formatEmployeeNumber,
  parseEmployeeNumberSequence,
} from './employee-number-helpers';

const withEmployerId = <T extends { company_id: string }>(row: T): T & { employer_id: string } => ({
  ...row,
  employer_id: row.company_id,
});

const hrProfileInclude = {
  designation: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  addresses: true,
  documents: { orderBy: { created_at: 'desc' as const } },
} as const;

const employmentInclude = {
  workforce_person: { include: workforcePersonInclude },
  hr_profile: { include: hrProfileInclude },
} as const;

function resolveAddressPayload(personal?: {
  address?: string;
  addresses?: AddressesInput;
}): AddressesInput | undefined {
  if (personal?.addresses?.present) {
    return personal.addresses;
  }
  if (personal?.address?.trim()) {
    return {
      present: {
        line1: personal.address.trim(),
        city: '',
        state: '',
        pincode: '',
      },
    };
  }
  return personal?.addresses;
}

const formatTimeOnly = (value: Date | string) => {
  if (typeof value === 'string') {
    const match = value.match(/T(\d{2}:\d{2}:\d{2})/);
    if (match) return match[1]!;
    if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 8);
    return value;
  }
  return value.toISOString().slice(11, 19);
};

async function loadOrganizationContext(
  employmentId: string,
  designation: { id: string; name: string } | null | undefined,
  department: { id: string; name: string } | null | undefined,
): Promise<EmployeeOrgContext> {
  const member = await prisma.companyMember.findFirst({
    where: { employment_id: employmentId },
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
          work_shift: {
            select: {
              id: true,
              name: true,
              start_time: true,
              end_time: true,
              break_minutes: true,
            },
          },
        },
      },
    },
  });

  const currentShift = member?.employee_shifts[0]?.work_shift ?? null;

  return {
    designation: designation ?? null,
    department: department ?? member?.department ?? null,
    manager: member?.manager?.user
      ? {
          id: member.manager.id,
          user_id: member.manager.user_id!,
          name: member.manager.user.name,
          phone_no: member.manager.user.phone_no,
        }
      : null,
    work_shift: currentShift
      ? {
          id: currentShift.id,
          name: currentShift.name,
          start_time: formatTimeOnly(currentShift.start_time),
          end_time: formatTimeOnly(currentShift.end_time),
          break_minutes: currentShift.break_minutes,
        }
      : null,
  };
}

async function toEmploymentDto(row: {
  id: string;
  company_id: string;
  workforce_person_id: string;
  is_active: boolean;
  separation_reason: SeparationReason | null;
  hr_profile?:
    | (EmployeeEmploymentDTO['hr_profile'] & {
        designation?: { id: string; name: string } | null;
        department?: { id: string; name: string } | null;
        onboarding_stage?: OnboardingStage | null;
      })
    | null;
  workforce_person: EmployeeEmploymentDTO['workforce_person'] & {
    linked_user?: EmployeeEmploymentDTO['employee'] | null;
  };
  [key: string]: unknown;
}): Promise<EmployeeEmploymentDTO> {
  const organization = await loadOrganizationContext(
    row.id,
    row.hr_profile?.designation ?? null,
    row.hr_profile?.department ?? null,
  );

  const onboardingStage = row.hr_profile?.onboarding_stage ?? null;
  const workforcePerson = {
    id: row.workforce_person.id,
    phone_no: row.workforce_person.phone_no,
    karigari_id: row.workforce_person.karigari_id,
    linked_user_id: row.workforce_person.linked_user_id,
    linked_user: row.workforce_person.linked_user ?? null,
  };

  return enrichEmploymentWithProfileSections({
    ...withEmployerId(row),
    workforce_person: workforcePerson,
    employee: buildEmployeeView({
      workforce_person: row.workforce_person,
      hr_profile: row.hr_profile,
    }),
    organization,
    status: {
      is_active: row.is_active,
      separation_reason: row.separation_reason,
      onboarding_stage: onboardingStage,
      ui_status: mapEmploymentStatusToUi(row.is_active, onboardingStage),
    },
  } as EmployeeEmploymentDTO);
}

export const getEmployerRosterService = async (
  employerId: string,
  query: GetEmployerRosterQuery,
): Promise<{ roster: EmployeeEmploymentDTO[]; meta: Record<string, number> }> => {
  const { is_active, separation_reason, search, limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {
    company_id: employerId,
  };

  if (is_active !== undefined) {
    whereClause.is_active = is_active;
  }

  if (separation_reason) {
    whereClause.separation_reason = separation_reason;
    whereClause.is_active = false;
  }

  if (search) {
    whereClause.workforce_person = {
      OR: [
        { phone_no: { contains: search } },
        { karigari_id: { contains: search, mode: 'insensitive' } },
        { linked_user: { name: { contains: search, mode: 'insensitive' } } },
      ],
    };
  }

  const [roster, total] = await Promise.all([
    prisma.employeeEmployment.findMany({
      where: whereClause,
      include: employmentInclude,
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
    include: employmentInclude,
  });
  if (!employeeDetails) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee record not found or access denied');
  }
  return toEmploymentDto(employeeDetails as any);
};

export const updateEmployeeProfileService = async (
  employerId: string,
  employmentId: string,
  payload: import('@repo/types').UpdateEmployeeProfilePayload,
): Promise<EmployeeEmploymentDTO> => {
  const existing = await prisma.employeeEmployment.findFirst({
    where: {
      id: employmentId,
      company_id: employerId,
      is_active: true,
    },
    include: {
      hr_profile: { include: { addresses: true } },
      workforce_person: { select: { id: true, linked_user_id: true } },
      company_member: { select: { id: true } },
    },
  });

  if (!existing) {
    throw new AppError(
      404,
      'EMPLOYEE_NOT_FOUND',
      'Active employee record not found or access denied',
    );
  }

  if (!existing.hr_profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'HR profile not found for this employment');
  }

  const { personal, job, payment, identity, employee_no, notes } = payload;

  if (employee_no && employee_no !== existing.employee_no) {
    const duplicateNo = await prisma.employeeEmployment.findFirst({
      where: {
        company_id: employerId,
        employee_no,
        ...ACTIVE_EMPLOYMENT_FILTER,
        id: { not: employmentId },
      },
      select: { id: true },
    });
    if (duplicateNo) {
      throw new AppError(
        409,
        'EMPLOYEE_NO_EXISTS',
        `Employee number "${employee_no}" is already assigned to an active employee in your company.`,
        { conflict_field: 'employee_no', employee_no },
      );
    }
  }

  if (job?.designation_id) {
    const designation = await prisma.companyDesignation.findFirst({
      where: { id: job.designation_id, company_id: employerId, is_active: true },
      select: { id: true },
    });
    if (!designation) {
      throw new AppError(400, 'INVALID_DESIGNATION', 'designation_id is not valid for this company');
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
      select: { id: true, user_id: true },
    });
    if (!supervisor) {
      throw new AppError(
        400,
        'INVALID_SUPERVISOR',
        'reporting_supervisor_id must be an active manager/lead in your company',
      );
    }
    if (
      supervisor.user_id &&
      existing.workforce_person?.linked_user_id &&
      supervisor.user_id === existing.workforce_person.linked_user_id
    ) {
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

  const addressPayload = resolveAddressPayload(personal);
  const legacyAddress =
    legacyAddressFromPresent(addressPayload?.present) ?? personal?.address?.trim() ?? undefined;

  const updated = await prisma.$transaction(async (tx) => {
    if (employee_no !== undefined) {
      await tx.employeeEmployment.update({
        where: { id: employmentId },
        data: { employee_no: employee_no || null },
      });
    }

    if (job?.joining_date) {
      await tx.employeeEmployment.update({
        where: { id: employmentId },
        data: { joined_at: new Date(`${job.joining_date}T00:00:00.000Z`) },
      });
    }

    await tx.employeeHrProfile.update({
      where: { id: existing.hr_profile!.id },
      data: {
        ...(personal?.full_name !== undefined ? { full_name: personal.full_name } : {}),
        ...(personal?.email !== undefined ? { email: personal.email || null } : {}),
        ...(personal?.date_of_birth !== undefined
          ? { date_of_birth: new Date(`${personal.date_of_birth}T00:00:00.000Z`) }
          : {}),
        ...(personal?.gender !== undefined ? { gender: personal.gender } : {}),
        ...(legacyAddress !== undefined ? { address: legacyAddress || null } : {}),
        ...(personal?.blood_group !== undefined ? { blood_group: personal.blood_group } : {}),
        ...(personal?.emergency_contact?.name !== undefined
          ? { emergency_contact_name: personal.emergency_contact.name || null }
          : {}),
        ...(personal?.emergency_contact?.relation !== undefined
          ? { emergency_contact_relation: personal.emergency_contact.relation || null }
          : {}),
        ...(personal?.emergency_contact?.phone_no !== undefined
          ? { emergency_contact_phone: personal.emergency_contact.phone_no || null }
          : {}),
        ...mapPersonalExtras(personal),
        ...(job?.designation_id !== undefined ? { designation_id: job.designation_id } : {}),
        ...(job?.department_id !== undefined ? { department_id: job.department_id } : {}),
        ...(job?.branch_location !== undefined
          ? { branch_location: job.branch_location || null }
          : {}),
        ...(job?.branch_location !== undefined
          ? {
              branch_id: await upsertCompanyBranchByName(
                tx,
                employerId,
                job.branch_location,
              ),
            }
          : {}),
        ...(job?.employee_type !== undefined ? { employee_type: job.employee_type } : {}),
        ...(job?.work_location !== undefined ? { work_location: job.work_location || null } : {}),
        ...(job?.skill_trade !== undefined ? { skill_trade: job.skill_trade || null } : {}),
        ...(job?.experience_years !== undefined ? { experience_years: job.experience_years } : {}),
        ...(job?.certification_licenses !== undefined
          ? { certification_licenses: job.certification_licenses || null }
          : {}),
        ...(job?.safety_training_completed !== undefined
          ? { safety_training_completed: job.safety_training_completed }
          : {}),
        ...(payment?.method !== undefined ? { payment_method: payment.method } : {}),
        ...(payment !== undefined
          ? {
              payment_details:
                buildPaymentDetails(payment as OnboardEmployeePayload['payment']) ?? undefined,
            }
          : {}),
        ...(payment?.basic_salary !== undefined ? { basic_salary: payment.basic_salary } : {}),
        ...(payment?.salary_type !== undefined ? { salary_type: payment.salary_type } : {}),
        ...(payment?.payment_frequency !== undefined
          ? { salary_payment_frequency: payment.payment_frequency }
          : {}),
        ...(payment?.overtime_eligible !== undefined
          ? { overtime_eligible: payment.overtime_eligible }
          : {}),
        ...(payment?.pf_applicable !== undefined ? { pf_applicable: payment.pf_applicable } : {}),
        ...(payment?.esi_applicable !== undefined ? { esi_applicable: payment.esi_applicable } : {}),
        ...(identity?.aadhaar_number !== undefined
          ? { aadhaar_number: identity.aadhaar_number || null }
          : {}),
        ...(identity?.pan_number !== undefined ? { pan_number: identity.pan_number || null } : {}),
        ...(identity?.driving_license_number !== undefined
          ? { driving_license_number: identity.driving_license_number || null }
          : {}),
        ...(identity?.identity_document_url !== undefined
          ? { identity_document_url: identity.identity_document_url || null }
          : {}),
        ...(identity?.additional_document_url !== undefined
          ? { additional_document_url: identity.additional_document_url || null }
          : {}),
        ...mapIdentityExtras(identity),
        ...(notes !== undefined ? { notes: notes || null } : {}),
      } as Prisma.EmployeeHrProfileUpdateInput,
    });

    if (addressPayload) {
      await upsertHrAddresses(tx, existing.hr_profile!.id, addressPayload);
    }

    if (existing.company_member?.id) {
      await tx.companyMember.update({
        where: { id: existing.company_member.id },
        data: {
          ...(job?.department_id !== undefined ? { department_id: job.department_id } : {}),
          ...(job?.reporting_supervisor_id !== undefined
            ? { manager_company_member_id: job.reporting_supervisor_id }
            : {}),
        },
      });

      if (job?.work_shift_id) {
        await tx.employeeShift.updateMany({
          where: {
            company_member_id: existing.company_member.id,
            effective_to: null,
          },
          data: { effective_to: new Date() },
        });

        await tx.employeeShift.create({
          data: {
            company_id: employerId,
            company_member_id: existing.company_member.id,
            work_shift_id: job.work_shift_id,
            effective_from: job.joining_date
              ? new Date(`${job.joining_date}T00:00:00.000Z`)
              : new Date(),
          },
        });
      }
    }

    return tx.employeeEmployment.findFirst({
      where: { id: employmentId },
      include: employmentInclude,
    });
  });

  if (!updated) {
    throw new AppError(500, 'UPDATE_FAILED', 'Failed to update employee profile');
  }

  return toEmploymentDto(updated as any);
};

const SUPERVISOR_ROLE_CODES = [
  SYSTEM_ROLE_CODES.OWNER,
  SYSTEM_ROLE_CODES.ADMIN,
  SYSTEM_ROLE_CODES.HR,
  SYSTEM_ROLE_CODES.MANAGER,
  SYSTEM_ROLE_CODES.TEAM_LEAD,
] as const;

export const getNextEmployeeNumberService = async (companyId: string): Promise<string> => {
  const rows = await prisma.employeeEmployment.findMany({
    where: {
      company_id: companyId,
      employee_no: { not: null },
    },
    select: { employee_no: true },
  });

  let maxSequence = 0;
  for (const row of rows) {
    const sequence = row.employee_no ? parseEmployeeNumberSequence(row.employee_no) : null;
    if (sequence != null && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return formatEmployeeNumber(maxSequence + 1);
};

async function resolveWorkforcePersonForOnboard(params: {
  phone_no?: string;
  karigari_id?: string;
}): Promise<{
  workforcePerson: Awaited<ReturnType<typeof findWorkforcePersonByPhoneOrKarigari>>;
  matchedBy: 'phone_no' | 'karigari_id' | 'new' | null;
}> {
  const { phone_no, karigari_id } = params;

  if (phone_no) {
    const byPhone = await findWorkforcePersonByPhoneOrKarigari(phone_no);
    if (byPhone) {
      return { workforcePerson: byPhone, matchedBy: 'phone_no' };
    }
  }

  if (karigari_id) {
    const byKarigari = await findWorkforcePersonByPhoneOrKarigari(undefined, karigari_id);
    if (byKarigari) {
      return { workforcePerson: byKarigari, matchedBy: 'karigari_id' };
    }
  }

  if (!phone_no) {
    return { workforcePerson: null, matchedBy: null };
  }

  const created = await prisma.workforcePerson.create({
    data: {
      phone_no,
      karigari_id: karigari_id ?? null,
    },
  });

  return { workforcePerson: created, matchedBy: 'new' };
}

export const getEmployerDepartmentsMetaService = async (
  companyId: string,
  query: GetEmployerDepartmentsMetaQuery,
): Promise<{ items: MetaDepartmentItem[]; meta: Record<string, number> }> => {
  const { ensureCompanyOrgCatalog } = await import('./company-setup-service');
  await ensureCompanyOrgCatalog(companyId);
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
    items: rows
      .filter((row) => row.user && row.user_id)
      .map((row) => ({
        id: row.id,
        user_id: row.user_id!,
        name: row.user!.name,
        phone_no: row.user!.phone_no,
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
      identity.identity_document_url,
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
      where: {
        company_id: employerId,
        employee_no,
        ...ACTIVE_EMPLOYMENT_FILTER,
      },
      select: { id: true },
    });
    if (duplicateNo) {
      throw new AppError(
        409,
        'EMPLOYEE_NO_EXISTS',
        `Employee number "${employee_no}" is already assigned to an active employee in your company.`,
        { conflict_field: 'employee_no', employee_no },
      );
    }
  }

  if (!phone_no && !karigari_id) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'phone_no or karigari_id is required to onboard a workforce person',
    );
  }

  const fullName = personal?.full_name?.trim();
  if (!fullName && action === 'submit') {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'personal.full_name is required to onboard an employee',
    );
  }

  const { workforcePerson, matchedBy } = await resolveWorkforcePersonForOnboard({
    phone_no,
    karigari_id,
  });

  if (!workforcePerson) {
    throw new AppError(
      404,
      'WORKFORCE_NOT_FOUND',
      'Workforce person not found. Provide phone_no to create a new HR record.',
    );
  }

  const existingEmployment = await prisma.employeeEmployment.findFirst({
    where: {
      company_id: employerId,
      workforce_person_id: workforcePerson.id,
      ...ACTIVE_EMPLOYMENT_FILTER,
    },
  });

  if (existingEmployment) {
    const conflictMessage =
      matchedBy === 'phone_no'
        ? `Mobile number ${phone_no} is already onboarded as an active employee in your company.`
        : matchedBy === 'karigari_id'
          ? `Karigari ID "${karigari_id}" is already onboarded as an active employee in your company.`
          : 'This worker already has an active employment at your company.';

    throw new AppError(409, 'ALREADY_ONBOARDED', conflictMessage, {
      conflict_field: matchedBy === 'new' ? 'workforce_person' : matchedBy,
      phone_no: phone_no ?? workforcePerson.phone_no,
      karigari_id: karigari_id ?? workforcePerson.karigari_id,
    });
  }

  const onboardingStage = resolveOnboardingStage(payload);
  const joinedAt = job?.joining_date
    ? new Date(`${job.joining_date}T00:00:00.000Z`)
    : new Date();

  const addressPayload = resolveAddressPayload(personal);
  const legacyAddress =
    legacyAddressFromPresent(addressPayload?.present) ?? personal?.address?.trim() ?? null;
  const personalExtras = mapPersonalExtras(personal);
  const identityExtras = mapIdentityExtras(identity);

  // HR onboard is immediately active on submit; draft rows stay inactive until submitted.
  const isActiveOnCreate = action === 'submit';

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
    if (
      supervisor.user_id &&
      workforcePerson.linked_user_id &&
      supervisor.user_id === workforcePerson.linked_user_id
    ) {
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
    const now = new Date();

    const otherActiveEmployments = await tx.employeeEmployment.findMany({
      where: {
        workforce_person_id: workforcePerson.id,
        company_id: { not: employerId },
        ...ACTIVE_EMPLOYMENT_FILTER,
      },
      select: { id: true },
    });

    if (otherActiveEmployments.length > 0) {
      await tx.employeeEmployment.updateMany({
        where: {
          workforce_person_id: workforcePerson.id,
          company_id: { not: employerId },
          ...ACTIVE_EMPLOYMENT_FILTER,
        },
        data: {
          is_active: false,
          separation_reason: SeparationReason.terminated,
          left_at: now,
        },
      });

      await tx.companyMember.updateMany({
        where: {
          employment_id: { in: otherActiveEmployments.map((row) => row.id) },
          is_active: true,
        },
        data: { is_active: false },
      });

      const staleMemberIds = await tx.companyMember.findMany({
        where: { employment_id: { in: otherActiveEmployments.map((row) => row.id) } },
        select: { id: true },
      });

      if (staleMemberIds.length > 0) {
        await tx.employeeShift.updateMany({
          where: {
            company_member_id: { in: staleMemberIds.map((row) => row.id) },
            effective_to: null,
          },
          data: { effective_to: now },
        });
      }
    }

    const branchId = await upsertCompanyBranchByName(tx, employerId, job?.branch_location);

    const created = await tx.employeeEmployment.create({
      data: {
        company_id: employerId,
        workforce_person_id: workforcePerson.id,
        employee_no: employee_no || null,
        is_active: isActiveOnCreate,
        separation_reason: null,
        joined_at: joinedAt,
        hr_profile: {
          create: {
            onboarding_stage: onboardingStage,
            full_name: personal?.full_name || fullName || 'Employee',
            email: personal?.email || null,
            date_of_birth: personal?.date_of_birth
              ? new Date(`${personal.date_of_birth}T00:00:00.000Z`)
              : null,
            gender: personal?.gender || null,
            address: legacyAddress,
            blood_group: personal?.blood_group || null,
            alternate_phone: personal?.alternate_phone || null,
            marital_status: (personalExtras.marital_status as MaritalStatus | undefined) ?? null,
            father_name: personalExtras.father_name ?? null,
            mother_name: personalExtras.mother_name ?? null,
            nationality: personalExtras.nationality ?? personal?.nationality ?? 'Indian',
            religion: personalExtras.religion ?? null,
            languages_known: personalExtras.languages_known ?? null,
            probation_period_months: personalExtras.probation_period_months ?? null,
            notice_period_days: personalExtras.notice_period_days ?? null,
            weekly_off: personalExtras.weekly_off ?? null,
            confirmation_date: personalExtras.confirmation_date ?? null,
            working_hours: personalExtras.working_hours ?? null,
            emergency_contact_name: personal?.emergency_contact?.name || null,
            emergency_contact_relation: personal?.emergency_contact?.relation || null,
            emergency_contact_phone: personal?.emergency_contact?.phone_no || null,
            designation_id: job?.designation_id || null,
            department_id: job?.department_id || null,
            branch_id: branchId,
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
            voter_id: identityExtras.voter_id ?? null,
            uan_number: identityExtras.uan_number ?? null,
            esi_number: identityExtras.esi_number ?? null,
            pf_number: identityExtras.pf_number ?? null,
            identity_document_url: identity?.identity_document_url || null,
            additional_document_url: identity?.additional_document_url || null,
            notes: notes || null,
          },
        },
      },
    });

    let memberId: string | undefined;

    if (employeeRoleId) {
      const member = await tx.companyMember.create({
        data: {
          user_id: workforcePerson.linked_user_id,
          company_id: employerId,
          employment_id: created.id,
          role_id: employeeRoleId,
          platform_type: PlatformType.EMPLOYEE,
          is_active: isActiveOnCreate,
          department_id: job?.department_id || null,
          manager_company_member_id: job?.reporting_supervisor_id || null,
        },
      });
      memberId = member.id;
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
    } else     if (memberId && job?.work_shift_id) {
      await tx.employeeShift.create({
        data: {
          company_id: employerId,
          company_member_id: memberId,
          work_shift_id: job.work_shift_id,
          effective_from: joinedAt,
        },
      });
    }

    if (addressPayload) {
      const profileRow = await tx.employeeHrProfile.findUnique({
        where: { employment_id: created.id },
        select: { id: true },
      });
      if (profileRow?.id) {
        await upsertHrAddresses(tx, profileRow.id, addressPayload);
      }
    }

    return tx.employeeEmployment.findFirst({
      where: { id: created.id },
      include: employmentInclude,
    });
  });

  if (!employment) {
    throw new AppError(500, 'ONBOARD_FAILED', 'Failed to create employment record');
  }

  if (isActiveOnCreate && workforcePerson.linked_user_id) {
    await createNotificationService({
      userId: workforcePerson.linked_user_id,
      type: NotificationTypes.onboardRequest,
      title: 'Added to company roster',
      body: 'You have been onboarded to a company roster',
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
  const { is_active, separation_reason } = payload;

  const existingRecord = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      company_id: employerId,
    },
    include: {
      company_member: { select: { id: true } },
    },
  });

  if (!existingRecord) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee record not found or access denied');
  }

  if (is_active) {
    const otherActive = await prisma.employeeEmployment.findFirst({
      where: {
        company_id: employerId,
        workforce_person_id: existingRecord.workforce_person_id,
        is_active: true,
        id: { not: mappingId },
      },
      select: { id: true },
    });
    if (otherActive) {
      throw new AppError(
        409,
        'ACTIVE_EMPLOYMENT_EXISTS',
        'This worker already has another active employment at your company.',
      );
    }
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.employeeEmployment.update({
      where: { id: mappingId },
      data: {
        is_active,
        separation_reason: is_active ? null : separation_reason!,
        left_at: is_active ? null : now,
      },
      include: employmentInclude,
    });

    if (existingRecord.company_member) {
      await tx.companyMember.update({
        where: { id: existingRecord.company_member.id },
        data: { is_active },
      });

      if (!is_active) {
        await tx.employeeShift.updateMany({
          where: {
            company_member_id: existingRecord.company_member.id,
            effective_to: null,
          },
          data: { effective_to: now },
        });
      }
    }

    return row;
  });

  return toEmploymentDto(updated as any);
};

export const getAllEmployeeEmploymentService = async (
  employeeId: string,
  query: GetAllEmployeeEmploymentQuery,
): Promise<{ employments: GetAllEmployeeEmploymentResponse; meta: Record<string, number> }> => {
  const { limit = 10, page = 1 } = query;
  const skip = (page - 1) * limit;

  const whereClause = employmentForAppUserWhere(employeeId);

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
      ...employmentForAppUserWhere(employeeId),
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
    ...employmentForAppUserWhere(employeeId),
    is_active: false,
    hr_profile: {
      onboarding_stage: OnboardingStage.draft,
    },
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
      ...employmentForAppUserWhere(employeeId),
    },
    include: { company: companyAsEmployerInclude },
  });

  if (!existingRecord) {
    throw new AppError(404, 'EMPLOYMENT_NOT_FOUND', 'Employment record not found or access denied');
  }

  return mapEmploymentToApi(existingRecord as any) as GetEmployeeEmploymentResponse;
};

export const declineEmploymentRequestService = async (employeeId: string, mappingId: string) => {
  const existingRecord = await prisma.employeeEmployment.findFirst({
    where: {
      id: mappingId,
      ...employmentForAppUserWhere(employeeId),
      is_active: false,
      hr_profile: { onboarding_stage: OnboardingStage.draft },
    },
  });

  if (!existingRecord) {
    throw new AppError(
      404,
      'EMPLOYMENT_NOT_FOUND',
      'Draft employment not found or already processed',
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.companyMember.deleteMany({ where: { employment_id: mappingId } });
    return tx.employeeEmployment.delete({ where: { id: mappingId } });
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
