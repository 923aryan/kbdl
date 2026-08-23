import {
  CompanyStatus,
  ensureDefaultCompanyRoles,
  PlatformType,
  prisma,
  SYSTEM_ROLE_CODES,
} from '@repo/db/server';
import type { CompanyHrProfileView, CompanyProfileView, UpsertCompanyProfilePayload } from '@repo/types';
import { persistEmployerSession, statusToVerified } from '../auth/employer-session';
import { AppError } from '../utils/api-error';
import { ensureLeaveSetup } from './leave-service';

function blank(value?: string | null) {
  const next = value?.trim();
  return next ? next : null;
}

function clockTime(hours: number, minutes: number) {
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
}

function isoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const raw = value instanceof Date ? value.toISOString() : value;
  return raw.slice(0, 10);
}

export async function seedCompanyDefaults(companyId: string, tx: typeof prisma) {
  await tx.payrollSettings.create({
    data: { company_id: companyId },
  });
  await tx.statutorySettings.create({
    data: { company_id: companyId },
  });
  await tx.paymentSettings.create({
    data: { company_id: companyId },
  });
  await tx.companyWorkSchedule.create({
    data: { company_id: companyId },
  });
  await tx.overtimeSettings.create({
    data: { company_id: companyId },
  });
  const generalDept = await tx.department.create({
    data: { company_id: companyId, name: 'General', description: 'Default department' },
  });
  const hrDept = await tx.department.create({
    data: { company_id: companyId, name: 'HR', description: 'Human resources' },
  });
  await tx.companyDesignation.create({
    data: { company_id: companyId, name: 'Worker', description: 'Default designation' },
  });
  const hrDesignation = await tx.companyDesignation.create({
    data: { company_id: companyId, name: 'HR', description: 'Human resources' },
  });
  await tx.workShift.create({
    data: {
      company_id: companyId,
      name: 'General',
      start_time: clockTime(9, 0),
      end_time: clockTime(18, 0),
      break_minutes: 60,
      sort_order: 10,
    },
  });
  await ensureLeaveSetup(companyId, tx as unknown as typeof prisma);
  return { generalDept, hrDept, hrDesignation };
}

export async function ensureCompanyOrgCatalog(companyId: string, db: typeof prisma = prisma) {
  const deptCount = await db.department.count({ where: { company_id: companyId } });
  if (deptCount === 0) {
    await db.department.createMany({
      data: [
        { company_id: companyId, name: 'General', description: 'Default department' },
        { company_id: companyId, name: 'HR', description: 'Human resources' },
      ],
    });
  }

  const titleCount = await db.companyDesignation.count({ where: { company_id: companyId } });
  if (titleCount === 0) {
    await db.companyDesignation.createMany({
      data: [
        { company_id: companyId, name: 'Worker', description: 'Default designation' },
        { company_id: companyId, name: 'HR', description: 'Human resources' },
      ],
    });
  }

  const shiftCount = await db.workShift.count({ where: { company_id: companyId } });
  if (shiftCount === 0) {
    await db.workShift.create({
      data: {
        company_id: companyId,
        name: 'General',
        start_time: clockTime(9, 0),
        end_time: clockTime(18, 0),
        break_minutes: 60,
        sort_order: 10,
      },
    });
  }

  await ensureLeaveSetup(companyId, db);
}

function toView(
  company: {
    id: string;
    company_name: string;
    company_address: string | null;
    state: string | null;
    gst_number: string | null;
    pan: string | null;
    epf_registration_no: string | null;
    esic_code: string | null;
    status: CompanyStatus;
    is_verified: boolean;
  },
  setupPending: boolean,
  hrProfile: CompanyHrProfileView | null,
): CompanyProfileView {
  return {
    id: company.id,
    company_name: company.company_name,
    company_address: company.company_address,
    state: company.state,
    gst_number: company.gst_number,
    pan: company.pan,
    epf_registration_no: company.epf_registration_no,
    esic_code: company.esic_code,
    status: company.status,
    is_verified: company.is_verified,
    setup_pending: setupPending,
    hr_profile: hrProfile,
  };
}

async function loadHrProfile(args: {
  userId?: string;
  companyId?: string;
  setupPending?: boolean;
}): Promise<CompanyHrProfileView | null> {
  if (!args.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: { name: true, email: true, phone_no: true },
  });
  if (!user) return null;

  if (args.companyId && !args.setupPending) {
    const member = await prisma.companyMember.findFirst({
      where: {
        user_id: args.userId,
        company_id: args.companyId,
        is_active: true,
      },
      include: {
        role: { select: { code: true } },
        employment: { include: { hr_profile: true, workforce_person: true } },
      },
    });
    if (member?.employment?.hr_profile) {
      const profile = member.employment.hr_profile;
      return {
        employment_id: member.employment.id,
        full_name: profile.full_name,
        email: profile.email ?? user.email,
        phone_no: member.employment.workforce_person.phone_no,
        date_of_birth: isoDate(profile.date_of_birth),
        gender: profile.gender,
        address: profile.address,
        role_code: member.role.code,
      };
    }
  }

  return {
    employment_id: null,
    full_name: user.name,
    email: user.email,
    phone_no: user.phone_no,
    date_of_birth: null,
    gender: null,
    address: null,
    role_code: 'HR',
  };
}

export async function getCompanyProfileService(auth: {
  id: string;
  user_id?: string;
  setup_pending?: boolean;
}): Promise<CompanyProfileView> {
  const hrProfile = await loadHrProfile({
    userId: auth.user_id,
    companyId: auth.id,
    setupPending: auth.setup_pending,
  });
  if (!auth.id || auth.setup_pending) {
    return {
      id: '',
      company_name: '',
      company_address: null,
      state: null,
      gst_number: null,
      pan: null,
      epf_registration_no: null,
      esic_code: null,
      status: 'onboarding',
      is_verified: false,
      setup_pending: true,
      hr_profile: hrProfile,
    };
  }
  const company = await prisma.company.findUnique({ where: { id: auth.id } });
  if (!company) throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Company not found');
  return toView(company, false, hrProfile);
}

async function upsertHrEmployment(tx: typeof prisma, args: {
  user: { id: string; name: string; email: string | null; phone_no: string };
  companyId: string;
  hrRoleId: string;
  hrDepartmentId: string;
  hrDesignationId: string;
  body?: Pick<
    UpsertCompanyProfilePayload,
    'hr_full_name' | 'hr_date_of_birth' | 'hr_gender' | 'hr_address'
  >;
}) {
  const phone = args.user.phone_no;
  if (!phone) {
    throw new AppError(400, 'PHONE_REQUIRED', 'HR phone number is required to create an employee profile');
  }

  let workforce = await tx.workforcePerson.findUnique({ where: { phone_no: phone } });
  if (!workforce) {
    workforce = await tx.workforcePerson.create({
      data: { phone_no: phone, linked_user_id: args.user.id },
    });
  } else if (workforce.linked_user_id && workforce.linked_user_id !== args.user.id) {
    throw new AppError(409, 'PHONE_IN_USE', 'This HR phone is already linked to another account');
  } else if (workforce.linked_user_id !== args.user.id) {
    workforce = await tx.workforcePerson.update({
      where: { id: workforce.id },
      data: { linked_user_id: args.user.id },
    });
  }

  const fullName = blank(args.body?.hr_full_name) ?? args.user.name;
  const email = args.user.email;
  const dob = blank(args.body?.hr_date_of_birth);
  const gender = blank(args.body?.hr_gender);
  const address = blank(args.body?.hr_address);

  const existing = await tx.employeeEmployment.findFirst({
    where: {
      company_id: args.companyId,
      workforce_person_id: workforce.id,
      is_active: true,
    },
    include: { company_member: true, hr_profile: true },
  });

  if (existing) {
    await tx.employeeHrProfile.update({
      where: { employment_id: existing.id },
      data: {
        full_name: fullName,
        email,
        date_of_birth: dob ? new Date(`${dob}T00:00:00.000Z`) : null,
        gender,
        address,
        designation_id: args.hrDesignationId,
        department_id: args.hrDepartmentId,
        employee_type: 'full_time',
      },
    });
    if (existing.company_member) {
      await tx.companyMember.update({
        where: { id: existing.company_member.id },
        data: {
          user_id: args.user.id,
          role_id: args.hrRoleId,
          platform_type: PlatformType.EMPLOYER,
          department_id: args.hrDepartmentId,
          is_active: true,
        },
      });
    }
    await tx.user.update({
      where: { id: args.user.id },
      data: { name: fullName },
    });
    return existing.id;
  }

  const employment = await tx.employeeEmployment.create({
    data: {
      company_id: args.companyId,
      workforce_person_id: workforce.id,
      employee_no: `HR-${args.user.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
      is_active: true,
      joined_at: new Date(),
      hr_profile: {
        create: {
          onboarding_stage: 'onboard',
          full_name: fullName,
          email,
          date_of_birth: dob ? new Date(`${dob}T00:00:00.000Z`) : null,
          gender,
          address,
          designation_id: args.hrDesignationId,
          department_id: args.hrDepartmentId,
          employee_type: 'full_time',
        },
      },
    },
  });

  await tx.companyMember.create({
    data: {
      user_id: args.user.id,
      company_id: args.companyId,
      employment_id: employment.id,
      platform_type: PlatformType.EMPLOYER,
      role_id: args.hrRoleId,
      department_id: args.hrDepartmentId,
      is_active: true,
    },
  });

  await tx.user.update({
    where: { id: args.user.id },
    data: { name: fullName },
  });

  return employment.id;
}

export async function upsertCompanyProfileService(args: {
  userId: string;
  email: string;
  companyId: string;
  setupPending?: boolean;
  roleCode?: string;
  body: UpsertCompanyProfilePayload;
}) {
  const user = await prisma.user.findUnique({ where: { id: args.userId } });
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'User not found');

  const submit = args.body.submit_for_review !== false;
  const nextStatus: CompanyStatus = submit ? 'pending_review' : 'onboarding';

  if (!args.companyId || args.setupPending) {
    const invite = await prisma.hrInvite.findFirst({
      where: {
        email: user.email ?? args.email,
        status: { in: ['pending', 'accepted'] },
      },
      orderBy: { created_at: 'desc' },
    });
    if (!invite) {
      throw new AppError(
        403,
        'INVITE_REQUIRED',
        'You need an HR invite from KBDL before onboarding a company',
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          company_name: args.body.company_name.trim(),
          company_address: args.body.company_address.trim(),
          state: args.body.state.trim(),
          gst_number: blank(args.body.gst_number),
          pan: blank(args.body.pan),
          epf_registration_no: blank(args.body.epf_registration_no),
          esic_code: blank(args.body.esic_code),
          status: nextStatus,
          is_verified: statusToVerified(nextStatus),
        },
      });

      const roleIds = await ensureDefaultCompanyRoles(company.id, tx);
      const catalogs = await seedCompanyDefaults(company.id, tx as unknown as typeof prisma);

      await upsertHrEmployment(tx as unknown as typeof prisma, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone_no: user.phone_no || invite.phone_no,
        },
        companyId: company.id,
        hrRoleId: roleIds[SYSTEM_ROLE_CODES.HR]!,
        hrDepartmentId: catalogs.hrDept.id,
        hrDesignationId: catalogs.hrDesignation.id,
        body: args.body,
      });

      if (args.body.company_location) {
        await tx.$executeRaw`
          UPDATE companies
          SET company_location =
            ST_SetSRID(
              ST_MakePoint(
                ${args.body.company_location.longitude},
                ${args.body.company_location.latitude}
              ),
              4326
            )::geography
          WHERE id = ${company.id}::uuid
        `;
      }

      await tx.hrInvite.update({
        where: { id: invite.id },
        data: {
          status: 'accepted',
          accepted_at: invite.accepted_at ?? new Date(),
          user_id: user.id,
          company_id: company.id,
        },
      });

      return company;
    });

    const session = await persistEmployerSession({
      user,
      company: created,
      roleCode: SYSTEM_ROLE_CODES.HR,
      setupPending: false,
    });
    const hrProfile = await loadHrProfile({
      userId: user.id,
      companyId: created.id,
      setupPending: false,
    });

    return { ...session, profile: toView(created, false, hrProfile) };
  }

  const existing = await prisma.company.findUnique({ where: { id: args.companyId } });
  if (!existing) throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Company not found');

  const locked = existing.status === 'active' || existing.status === 'suspended';
  const nextUpdateStatus: CompanyStatus = locked
    ? existing.status
    : submit
      ? 'pending_review'
      : 'onboarding';

  const company = await prisma.$transaction(async (tx) => {
    const updated = await tx.company.update({
      where: { id: args.companyId },
      data: {
        company_name: args.body.company_name.trim(),
        company_address: args.body.company_address.trim(),
        state: args.body.state.trim(),
        gst_number: blank(args.body.gst_number),
        pan: blank(args.body.pan),
        epf_registration_no: blank(args.body.epf_registration_no),
        esic_code: blank(args.body.esic_code),
        status: nextUpdateStatus,
        is_verified: statusToVerified(nextUpdateStatus),
      },
    });

    const roleIds = await ensureDefaultCompanyRoles(updated.id, tx);
    let hrDept = await tx.department.findFirst({
      where: { company_id: updated.id, name: 'HR' },
    });
    if (!hrDept) {
      hrDept = await tx.department.create({
        data: { company_id: updated.id, name: 'HR', description: 'Human resources' },
      });
    }
    let hrDesignation = await tx.companyDesignation.findFirst({
      where: { company_id: updated.id, name: 'HR' },
    });
    if (!hrDesignation) {
      hrDesignation = await tx.companyDesignation.create({
        data: { company_id: updated.id, name: 'HR', description: 'Human resources' },
      });
    }

    const isHr = args.roleCode === SYSTEM_ROLE_CODES.HR || args.setupPending;
    if (isHr && user.phone_no) {
      await upsertHrEmployment(tx as unknown as typeof prisma, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone_no: user.phone_no,
        },
        companyId: updated.id,
        hrRoleId: roleIds[SYSTEM_ROLE_CODES.HR]!,
        hrDepartmentId: hrDept.id,
        hrDesignationId: hrDesignation.id,
        body: args.body,
      });
    }

    return updated;
  });

  if (args.body.company_location) {
    await prisma.$executeRaw`
      UPDATE companies
      SET company_location =
        ST_SetSRID(
          ST_MakePoint(
            ${args.body.company_location.longitude},
            ${args.body.company_location.latitude}
          ),
          4326
        )::geography
      WHERE id = ${company.id}::uuid
    `;
  }

  const session = await persistEmployerSession({
    user,
    company,
    roleCode: SYSTEM_ROLE_CODES.HR,
    setupPending: false,
  });
  const hrProfile = await loadHrProfile({
    userId: user.id,
    companyId: company.id,
    setupPending: false,
  });

  return { ...session, profile: toView(company, false, hrProfile) };
}

export async function attachInvitedHrToCompany(args: {
  user: { id: string; name: string; email: string | null; phone_no: string };
  companyId: string;
}) {
  await prisma.$transaction(async (tx) => {
    const roleIds = await ensureDefaultCompanyRoles(args.companyId, tx);
    let hrDept = await tx.department.findFirst({
      where: { company_id: args.companyId, name: 'HR' },
    });
    if (!hrDept) {
      hrDept = await tx.department.create({
        data: { company_id: args.companyId, name: 'HR', description: 'Human resources' },
      });
    }
    let hrDesignation = await tx.companyDesignation.findFirst({
      where: { company_id: args.companyId, name: 'HR' },
    });
    if (!hrDesignation) {
      hrDesignation = await tx.companyDesignation.create({
        data: { company_id: args.companyId, name: 'HR', description: 'Human resources' },
      });
    }

    await upsertHrEmployment(tx as unknown as typeof prisma, {
      user: args.user,
      companyId: args.companyId,
      hrRoleId: roleIds[SYSTEM_ROLE_CODES.HR]!,
      hrDepartmentId: hrDept.id,
      hrDesignationId: hrDesignation.id,
      body: { hr_full_name: args.user.name },
    });
  });
}
