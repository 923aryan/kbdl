/**
 * Rich seed for Company architecture + per-company CompanyRole.
 *
 * Volume roughly matches production dump (dbdata.json):
 *   ~10 companies, ~17+ users, ~12 jobs, ~140 shifts, ~150 shift apps,
 *   ratings, notifications, employments, leads, etc.
 *
 * Usage (after schema change, once):
 *   pnpm --filter @repo/db exec prisma migrate deploy
 *   pnpm --filter @repo/db exec prisma generate
 *   pnpm --filter @repo/db run seed
 *
 * Full wipe + reseed (dev only):
 *   pnpm --filter @repo/db run db:reset-seed
 *
 * Demo employer login:
 *   email: employer@kbdl.dev
 *   OTP:   123456  (if backend login still hardcodes)
 *
 * HR employments use workforce_persons only (no User row on onboard).
 * App User rows are created separately for shift-swap / jobs and linked via linked_user_id.
 */

import { loadDbEnv } from '../scripts/resolve-database-url.mjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';
import { seedJulyPayrollMonth } from './seed-july-payroll.mjs';

const connectionString = loadDbEnv();

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SYSTEM_ROLES = [
  { code: 'OWNER', name: 'Owner', description: 'Full company ownership', sort_order: 10, is_system: true },
  { code: 'ADMIN', name: 'Admin', description: 'Company administrator', sort_order: 20, is_system: true },
  { code: 'HR', name: 'HR', description: 'Human resources', sort_order: 30, is_system: true },
  { code: 'RECRUITER', name: 'Recruiter', description: 'Hiring and ATS', sort_order: 40, is_system: true },
  { code: 'MANAGER', name: 'Manager', description: 'People manager', sort_order: 50, is_system: true },
  { code: 'TEAM_LEAD', name: 'Team Lead', description: 'Team leadership', sort_order: 60, is_system: true },
  { code: 'EMPLOYEE', name: 'Employee', description: 'Standard employee', sort_order: 70, is_system: true },
  { code: 'FINANCE', name: 'Finance', description: 'Billing and finance', sort_order: 80, is_system: true },
];

const daysFromNow = (days) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const atHour = (base, hour) => {
  const d = new Date(base);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

/** Time-of-day for `@db.Time` columns */
const clockTime = (hour, minute = 0) => {
  const d = new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
  return d;
};

/** Calendar date (UTC) for `@db.Date` columns */
const calendarDate = (daysOffset = 0) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d;
};

const tsOnDate = (date, hour, minute = 0) => {
  const d = new Date(date);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
};

/** Custom (non-system) roles — display `name` can change later; members keep same role_id. */
const CUSTOM_ROLES = [
  {
    code: 'SITE_SUPERVISOR',
    name: 'Site Supervisor',
    description: 'Custom field supervisor role',
    sort_order: 90,
    permissions: { shifts: ['view', 'approve'] },
  },
  {
    code: 'WAREHOUSE_LEAD',
    name: 'Warehouse Lead',
    description: 'Custom warehouse floor lead',
    sort_order: 100,
    permissions: { inventory: ['view'], shifts: ['view'] },
  },
  {
    code: 'PAYROLL_CLERK',
    name: 'Payroll Clerk',
    description: 'Custom payroll ops (rename-safe via id)',
    sort_order: 110,
    permissions: { payroll: ['view', 'edit'] },
  },
];

async function ensureRoles(companyId) {
  const byCode = {};
  for (const def of SYSTEM_ROLES) {
    const row = await prisma.companyRole.upsert({
      where: { company_id_code: { company_id: companyId, code: def.code } },
      update: {
        name: def.name,
        description: def.description,
        is_system: def.is_system,
        sort_order: def.sort_order,
      },
      create: {
        company_id: companyId,
        code: def.code,
        name: def.name,
        description: def.description,
        is_system: def.is_system,
        is_active: true,
        sort_order: def.sort_order,
        permissions: {},
      },
    });
    byCode[def.code] = row.id;
  }

  for (const def of CUSTOM_ROLES) {
    const row = await prisma.companyRole.upsert({
      where: { company_id_code: { company_id: companyId, code: def.code } },
      update: {
        name: def.name,
        description: def.description,
        permissions: def.permissions,
        sort_order: def.sort_order,
      },
      create: {
        company_id: companyId,
        code: def.code,
        name: def.name,
        description: def.description,
        is_system: false,
        is_active: true,
        sort_order: def.sort_order,
        permissions: def.permissions,
      },
    });
    byCode[def.code] = row.id;
  }

  return byCode;
}

async function seedCompanySettings(companyId, { gst, verified }) {
  await prisma.payrollSettings.create({
    data: {
      company_id: companyId,
      pay_frequency: 'monthly',
      pay_day: 'last_working_day',
      payroll_cutoff_day: 28,
      financial_year_start: 'april',
      lock_after_processing: true,
    },
  });

  await prisma.statutorySettings.create({
    data: {
      company_id: companyId,
      employee_pf_rate: 12.0,
      employer_pf_rate: 12.0,
      employee_esic_rate: 0.75,
      employer_esic_rate: 3.25,
      professional_tax: 200.0,
      labour_welfare_fund: 6.0,
    },
  });

  await prisma.paymentSettings.create({
    data: {
      company_id: companyId,
      default_disbursement_method: 'NEFT',
      allow_bank_transfer: true,
      allow_upi: true,
      allow_cash: true,
    },
  });

  // 6-day week (Sun off), 8h/day
  await prisma.companyWorkSchedule.create({
    data: {
      company_id: companyId,
      monday_working: true,
      tuesday_working: true,
      wednesday_working: true,
      thursday_working: true,
      friday_working: true,
      saturday_working: true,
      sunday_working: false,
      daily_work_hours: 8.0,
      weekly_work_hours: 48.0,
      half_day_percentage: 50.0,
      absent_deduction_type: 'per_day_rate',
    },
  });

  await prisma.overtimeSettings.create({
    data: {
      company_id: companyId,
      enabled: true,
      ot_after_hours_per_day: 8.0,
      ot_after_hours_per_week: 48.0,
      rate_multiplier: 2.0,
      max_ot_hours_per_day: 4.0,
      include_holiday_ot: true,
      include_weekoff_ot: true,
      approval_required: true,
      auto_calculate_ot: true,
    },
  });

  // Enrich company compliance fields (Settings → Company Details)
  if (verified || gst) {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        pan: gst ? 'AABCT1234E' : null,
        state: 'Chandigarh',
        epf_registration_no: verified ? 'MH/MUM/123456' : null,
        esic_code: verified ? '51-000-1234567-000' : null,
      },
    });
  }
}

const DEFAULT_DESIGNATIONS = [
  'Electrician',
  'Helper',
  'Machine Operator',
  'Operator',
  'Assembly Worker',
  'Production worker',
  'Senior Technician',
  'Supervisor',
];

/** Job-title catalog per company (not RBAC CompanyRole) */
async function seedDesignations(companyId) {
  const rows = [];
  for (let i = 0; i < DEFAULT_DESIGNATIONS.length; i++) {
    const row = await prisma.companyDesignation.create({
      data: {
        company_id: companyId,
        name: DEFAULT_DESIGNATIONS[i],
        sort_order: (i + 1) * 10,
        is_active: true,
      },
    });
    rows.push(row);
  }
  return rows;
}

/** HR shift templates per company (not marketplace shifts) */
async function seedWorkShifts(companyId) {
  const general = await prisma.workShift.create({
    data: {
      company_id: companyId,
      name: 'General',
      start_time: clockTime(9, 0),
      end_time: clockTime(18, 0),
      break_minutes: 60,
      sort_order: 10,
    },
  });
  const morning = await prisma.workShift.create({
    data: {
      company_id: companyId,
      name: 'Morning',
      start_time: clockTime(6, 0),
      end_time: clockTime(14, 0),
      break_minutes: 30,
      sort_order: 20,
    },
  });
  const evening = await prisma.workShift.create({
    data: {
      company_id: companyId,
      name: 'Evening',
      start_time: clockTime(14, 0),
      end_time: clockTime(22, 0),
      break_minutes: 30,
      sort_order: 30,
    },
  });
  const night = await prisma.workShift.create({
    data: {
      company_id: companyId,
      name: 'Night',
      start_time: clockTime(22, 0),
      end_time: clockTime(6, 0),
      break_minutes: 30,
      sort_order: 40,
    },
  });
  return { general, morning, evening, night };
}

async function seedCompanyHolidays(companyId) {
  const year = new Date().getUTCFullYear();
  const holidays = [
    { date: new Date(Date.UTC(year, 0, 26)), name: 'Republic Day' },
    { date: new Date(Date.UTC(year, 7, 15)), name: 'Independence Day' },
    { date: new Date(Date.UTC(year, 9, 2)), name: 'Gandhi Jayanti' },
    { date: new Date(Date.UTC(year, 11, 25)), name: 'Christmas' },
  ];
  for (const h of holidays) {
    await prisma.companyHoliday.create({
      data: {
        company_id: companyId,
        date: h.date,
        name: h.name,
        is_optional: false,
      },
    });
  }
}

async function seedLeaveForCompany(companyId) {
  await prisma.companyLeavePolicy.create({
    data: {
      company_id: companyId,
      accrue_per_month: 1,
      annual_quota: 12,
      max_carry_forward: 12,
      carry_forward_at_year_end: true,
      encash_excess: true,
      policy_lines: [
        'Earn 1 leave every month',
        'Leave balance updates monthly',
        'Max 12 leaves carry forward from previous year',
        'Carry forward applies only at year-end',
        'Excess leaves may be encashed as per policy',
      ],
    },
  });

  const casual = await prisma.companyLeaveType.create({
    data: { company_id: companyId, name: 'Casual Leave', days_per_year: 12, sort_order: 10 },
  });
  const sick = await prisma.companyLeaveType.create({
    data: { company_id: companyId, name: 'Sick Leave', days_per_year: 6, sort_order: 20 },
  });
  await prisma.companyLeaveType.create({
    data: { company_id: companyId, name: 'Earned Leave', days_per_year: 12, sort_order: 30 },
  });

  const employments = await prisma.employeeEmployment.findMany({
    where: { company_id: companyId, is_active: true },
    select: { id: true },
    take: 4,
  });
  if (!employments[0]) return;

  const rows = [
    {
      company_id: companyId,
      employment_id: employments[0].id,
      leave_type_id: casual.id,
      from_date: daysFromNow(-20),
      to_date: daysFromNow(-18),
      days: 3,
      reason: 'Personal work',
      status: 'approved',
      applied_by_kind: 'hr',
      applied_at: daysFromNow(-25),
      decided_at: daysFromNow(-24),
    },
    {
      company_id: companyId,
      employment_id: employments[0].id,
      leave_type_id: sick.id,
      from_date: daysFromNow(4),
      to_date: daysFromNow(5),
      days: 2,
      reason: 'Fever',
      status: 'pending',
      applied_by_kind: 'manager',
      applied_at: daysFromNow(-1),
    },
  ];
  if (employments[1]) {
    rows.push({
      company_id: companyId,
      employment_id: employments[1].id,
      leave_type_id: casual.id,
      from_date: daysFromNow(-8),
      to_date: daysFromNow(-8),
      days: 1,
      reason: 'Family function',
      status: 'rejected',
      applied_by_kind: 'manager',
      applied_at: daysFromNow(-10),
      decided_at: daysFromNow(-9),
    });
  }
  await prisma.leaveRequest.createMany({ data: rows });
}

/**
 * HR onboard: workforce_person + employment + company_member (user_id null until app link).
 */
async function createEmploymentStint({
  fullName,
  phone,
  karigariId = null,
  companyId,
  departmentId = null,
  teamId = null,
  roleId,
  managerMemberId = null,
  employeeNo,
  joinedAt,
  leftAt = null,
  isActive,
  separationReason = null,
  designationId = null,
  seedAddresses = false,
  city = null,
}) {
  let workforcePerson = await prisma.workforcePerson.findUnique({
    where: { phone_no: phone },
  });

  if (!workforcePerson) {
    workforcePerson = await prisma.workforcePerson.create({
      data: {
        phone_no: phone,
        karigari_id: karigariId,
      },
    });
  } else if (karigariId && !workforcePerson.karigari_id) {
    workforcePerson = await prisma.workforcePerson.update({
      where: { id: workforcePerson.id },
      data: { karigari_id: karigariId },
    });
  }

  const employment = await prisma.employeeEmployment.create({
    data: {
      company_id: companyId,
      workforce_person_id: workforcePerson.id,
      employee_no: employeeNo,
      is_active: isActive,
      separation_reason: isActive ? null : separationReason,
      joined_at: joinedAt,
      left_at: isActive ? null : leftAt,
      hr_profile: {
        create: {
          full_name: fullName,
          department_id: departmentId,
          designation_id: designationId,
          onboarding_stage: 'onboard',
          employee_type: 'full_time',
          work_location: city,
          branch_location: city,
          basic_salary: 18000,
          salary_type: 'monthly',
          salary_payment_frequency: 'monthly',
          overtime_eligible: true,
          pf_applicable: true,
          esi_applicable: true,
          payment_method: 'bank',
          pan_number: 'ABCDE1234F',
          payment_details: {
            bank_name: 'SBI',
            account_number: '882345681234',
            ifsc_code: 'SBIN0001234',
            account_holder_name: fullName,
            ot_rate_per_hour: 130,
            allowance: 200,
          },
          ...(seedAddresses && city
            ? {
                addresses: {
                  create: [
                    {
                      type: 'present',
                      line1: `Staff quarters, ${city}`,
                      city,
                      state: 'Punjab',
                      pincode: '160001',
                    },
                    {
                      type: 'permanent',
                      line1: `Village near ${city}`,
                      city,
                      state: 'Punjab',
                      pincode: '140001',
                    },
                  ],
                },
              }
            : {}),
        },
      },
    },
  });

  if (city) {
    let branch = await prisma.companyBranch.findFirst({
      where: { company_id: companyId, name: city },
    });
    if (!branch) {
      branch = await prisma.companyBranch.create({
        data: { company_id: companyId, name: city },
      });
    }
    await prisma.employeeHrProfile.update({
      where: { employment_id: employment.id },
      data: { branch_id: branch.id },
    });
    try {
      await prisma.$executeRawUnsafe(
        `
        UPDATE company_branches cb
        SET location = c.company_location
        FROM companies c
        WHERE cb.id = $1::uuid
          AND c.id = $2::uuid
          AND cb.location IS NULL
          AND c.company_location IS NOT NULL
        `,
        branch.id,
        companyId,
      );
    } catch {
      /* optional until PostGIS copy is available */
    }
  }

  const member = await prisma.companyMember.create({
    data: {
      user_id: workforcePerson.linked_user_id ?? null,
      company_id: companyId,
      employment_id: employment.id,
      department_id: departmentId,
      team_id: teamId,
      platform_type: 'EMPLOYEE',
      role_id: roleId,
      manager_company_member_id: managerMemberId,
      is_active: isActive,
    },
  });

  return { employment, member, workforcePerson };
}

/**
 * App account (jobs / shift swap) — linked to existing WorkforcePerson by phone OTP match.
 */
async function linkAppUserForWorkforcePerson({ phone, userData }) {
  const workforcePerson = await prisma.workforcePerson.findUnique({
    where: { phone_no: phone },
  });
  if (!workforcePerson) {
    throw new Error(`WorkforcePerson not found for phone ${phone}`);
  }
  if (workforcePerson.linked_user_id) {
    const existing = await prisma.user.findUnique({
      where: { id: workforcePerson.linked_user_id },
    });
    if (existing) {
      return { user: existing, workforcePerson };
    }
  }

  const user = await prisma.user.create({ data: userData });

  await prisma.workforcePerson.update({
    where: { id: workforcePerson.id },
    data: { linked_user_id: user.id },
  });

  await prisma.companyMember.updateMany({
    where: {
      employment: { workforce_person_id: workforcePerson.id },
      user_id: null,
    },
    data: { user_id: user.id },
  });

  return { user, workforcePerson };
}

/**
 * Assign work shifts + ~14 days attendance for primary company members.
 */
async function seedAttendanceForCompany({
  companyId,
  workShifts,
  members,
  markedByMemberId,
}) {
  const from = calendarDate(-60);
  const assignments = [];

  for (let i = 0; i < members.length; i++) {
    const shift =
      i % 4 === 0
        ? workShifts.general
        : i % 4 === 1
          ? workShifts.morning
          : i % 4 === 2
            ? workShifts.evening
            : workShifts.night;

    assignments.push(
      await prisma.employeeShift.create({
        data: {
          company_id: companyId,
          company_member_id: members[i].id,
          work_shift_id: shift.id,
          effective_from: from,
          effective_to: null,
        },
      }),
    );
  }

  const attendanceRows = [];
  for (let dayOffset = -13; dayOffset <= 0; dayOffset++) {
    const date = calendarDate(dayOffset);
    const dow = date.getUTCDay(); // 0 = Sun

    for (let mi = 0; mi < members.length; mi++) {
      const member = members[mi];
      const shift =
        mi % 4 === 0
          ? workShifts.general
          : mi % 4 === 1
            ? workShifts.morning
            : mi % 4 === 2
              ? workShifts.evening
              : workShifts.night;

      if (dow === 0) {
        attendanceRows.push({
          company_id: companyId,
          company_member_id: member.id,
          work_shift_id: shift.id,
          date,
          check_in: null,
          check_out: null,
          worked_minutes: 0,
          ot_minutes: 0,
          status: 'week_off',
          source: 'system',
          marked_by_company_member_id: null,
          notes: null,
        });
        continue;
      }

      // Vary: some absents, half-days, OT days
      const pattern = (mi + Math.abs(dayOffset)) % 7;
      if (pattern === 0) {
        attendanceRows.push({
          company_id: companyId,
          company_member_id: member.id,
          work_shift_id: shift.id,
          date,
          check_in: null,
          check_out: null,
          worked_minutes: 0,
          ot_minutes: 0,
          status: 'absent',
          source: 'hr_manual',
          marked_by_company_member_id: markedByMemberId,
          notes: 'Marked absent by HR',
        });
        continue;
      }
      if (pattern === 1) {
        attendanceRows.push({
          company_id: companyId,
          company_member_id: member.id,
          work_shift_id: shift.id,
          date,
          check_in: tsOnDate(date, 9, 5),
          check_out: tsOnDate(date, 13, 0),
          worked_minutes: 235,
          ot_minutes: 0,
          status: 'half_day',
          source: 'hr_manual',
          marked_by_company_member_id: markedByMemberId,
          notes: null,
        });
        continue;
      }
      if (pattern === 2) {
        // Full day + OT (09:00–21:00 → 11h − 1h break = 10h → 2h OT)
        attendanceRows.push({
          company_id: companyId,
          company_member_id: member.id,
          work_shift_id: workShifts.general.id,
          date,
          check_in: tsOnDate(date, 9, 0),
          check_out: tsOnDate(date, 21, 0),
          worked_minutes: 600,
          ot_minutes: 120,
          status: 'present',
          source: 'hr_manual',
          marked_by_company_member_id: markedByMemberId,
          notes: 'OT approved',
        });
        continue;
      }

      attendanceRows.push({
        company_id: companyId,
        company_member_id: member.id,
        work_shift_id: shift.id,
        date,
        check_in: tsOnDate(date, 9, 0),
        check_out: tsOnDate(date, 18, 0),
        worked_minutes: 480,
        ot_minutes: 0,
        status: 'present',
        source: 'hr_manual',
        marked_by_company_member_id: markedByMemberId,
        notes: null,
      });
    }
  }

  // createMany in chunks
  const chunk = 100;
  for (let i = 0; i < attendanceRows.length; i += chunk) {
    await prisma.attendance.createMany({
      data: attendanceRows.slice(i, i + chunk),
    });
  }

  return { assignmentCount: assignments.length, attendanceCount: attendanceRows.length };
}

async function clearAll() {
  await prisma.hrInvite.deleteMany();
  await prisma.payrollStatutoryFiling.deleteMany().catch(() => {});
  await prisma.payrollRunEmployee.deleteMany().catch(() => {});
  await prisma.payrollRun.deleteMany().catch(() => {});
  await prisma.leaveRequest.deleteMany().catch(() => {});
  await prisma.companyLeaveType.deleteMany().catch(() => {});
  await prisma.companyLeavePolicy.deleteMany().catch(() => {});
  await prisma.rating.deleteMany();
  await prisma.shiftApplication.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.subscriptions.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.employeeHrAddress.deleteMany().catch(() => {});
  await prisma.employeeHrProfile.deleteMany().catch(() => {});
  await prisma.employeeEmployment.deleteMany();
  await prisma.workforcePerson.deleteMany().catch(() => {});
  await prisma.shift.deleteMany();
  await prisma.job.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employeeShift.deleteMany();
  await prisma.workShift.deleteMany();
  await prisma.companyHoliday.deleteMany();
  await prisma.companyDesignation.deleteMany().catch(() => {});
  await prisma.team.updateMany({ data: { lead_company_member_id: null } });
  await prisma.companyMember.updateMany({
    data: { manager_company_member_id: null, team_id: null, department_id: null },
  });
  await prisma.team.deleteMany();
  await prisma.department.deleteMany();
  await prisma.companyMember.deleteMany();
  await prisma.companyRole.deleteMany();
  await prisma.payrollSettings.deleteMany();
  await prisma.statutorySettings.deleteMany();
  await prisma.paymentSettings.deleteMany();
  await prisma.companyWorkSchedule.deleteMany();
  await prisma.overtimeSettings.deleteMany();
  await prisma.company.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('🌱 Seeding rich KBDL dataset (Company + CompanyRole)...');
  console.log('DB:', connectionString.replace(/:[^:@]+@/, ':****@'));

  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis');
  } catch (e) {
    console.warn('⚠️  PostGIS skipped:', e.message);
  }

  console.log('🧹 Clearing...');
  await clearAll();

  // -------------------------------------------------------------------------
  // Companies (≈10 like dump)
  // -------------------------------------------------------------------------
  const companyDefs = [
    {
      company_name: 'KBDL Corp',
      email: 'employer@kbdl.dev',
      phone: '+919876543210',
      ownerName: 'Demo Employer',
      address: '123 Industrial Area, Chandigarh',
      gst: '03ABCDE1234F1Z5',
      verified: true,
      tier: 'premium',
    },
    {
      company_name: 'Aryan Corp',
      email: 'aryan.corp@kbdl.dev',
      phone: '+919934853183',
      ownerName: 'Aryan Raj',
      address: 'Jalandhar, Punjab',
      gst: '03ARYAN1234F1Z5',
      verified: true,
      tier: 'basic',
    },
    {
      company_name: 'Atrinity',
      email: 'atrinity1@kbdl.dev',
      phone: '+918360170678',
      ownerName: 'Jagjeet',
      address: 'Mohali',
      verified: false,
      tier: 'basic',
    },
    {
      company_name: 'Atrinity North',
      email: 'atrinity2@kbdl.dev',
      phone: '+917888346624',
      ownerName: 'Aniket',
      address: 'Panchkula',
      verified: true,
      tier: 'premium',
    },
    {
      company_name: 'Atrinity South',
      email: 'atrinity3@kbdl.dev',
      phone: '+918054224492',
      ownerName: 'Sharma',
      address: 'Ludhiana',
      verified: false,
      tier: 'basic',
    },
    {
      company_name: 'Test Works',
      email: 'test.works@kbdl.dev',
      phone: '+918894853644',
      ownerName: 'Abhinav',
      address: 'Chandigarh',
      verified: true,
      tier: 'basic',
    },
    {
      company_name: 'Panesar Logistics',
      email: 'panesar@kbdl.dev',
      phone: '+919876543217',
      ownerName: 'Singh',
      address: 'Amritsar',
      verified: true,
      tier: 'premium',
    },
    {
      company_name: 'Alok Services',
      email: 'alok@kbdl.dev',
      phone: '+911234567890',
      ownerName: 'Alok',
      address: 'Delhi',
      verified: false,
      tier: 'basic',
    },
    {
      company_name: 'Srivastava Staffing',
      email: 'srivastava@kbdl.dev',
      phone: '+919999999999',
      ownerName: 'Srivastava',
      address: 'Noida',
      verified: true,
      tier: 'basic',
    },
    {
      company_name: 'Kaam Badlo Ops',
      email: 'ops@kbdl.dev',
      phone: '+919006598289',
      ownerName: 'Rajeev',
      address: 'Chandigarh',
      verified: true,
      tier: 'premium',
    },
  ];

  const workerPool = [
    {
      name: 'Ravi Kumar',
      phone: '+919876543211',
      karigariId: 'KG1000',
      skills: ['Electrician', 'Wiring'],
      city: 'Chandigarh',
    },
    {
      name: 'Aman Singh',
      phone: '+919876543212',
      karigariId: 'KG1001',
      skills: ['Helper', 'Loading'],
      city: 'Mohali',
    },
    {
      name: 'Priya Sharma',
      phone: '+919876543213',
      karigariId: 'KG1002',
      skills: ['Supervisor'],
      city: 'Panchkula',
    },
    {
      name: 'Dev Kumar',
      phone: '+918707462709',
      karigariId: 'KG1003',
      skills: ['Plumber'],
      city: 'Jalandhar',
    },
    {
      name: 'Rajeev Pal',
      phone: '+919006598280',
      karigariId: 'KG1004',
      skills: ['AC Technician'],
      city: 'Ludhiana',
    },
    {
      name: 'Arif Khan',
      phone: '+917275890926',
      karigariId: 'KG1005',
      skills: ['Welder'],
      city: 'Amritsar',
    },
    {
      name: 'Test Worker',
      phone: '+911234567898',
      karigariId: 'KG1006',
      skills: ['Helper'],
      city: 'Delhi',
    },
  ];

  const companies = [];
  const owners = [];

  for (const def of companyDefs) {
    const owner = await prisma.user.create({
      data: {
        name: def.ownerName,
        email: def.email,
        phone_no: def.phone,
        city: 'Chandigarh',
        skills: [],
        preferences: { language: 'en-IN', theme: 'system' },
        verification_level: def.verified ? 2 : 0,
        extra_shift: false,
      },
    });

    const company = await prisma.company.create({
      data: {
        company_name: def.company_name,
        company_address: def.address,
        gst_number: def.gst ?? null,
        is_verified: def.verified,
        status: def.verified ? 'active' : 'pending_review',
        preferences: { language: 'en-IN', subscription_tier: def.tier },
      },
    });

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE companies SET company_location = ST_SetSRID(ST_MakePoint(76.7794, 30.7333), 4326)::geography WHERE id = $1::uuid`,
        company.id,
      );
    } catch {
      /* optional */
    }

    const roleIds = await ensureRoles(company.id);

    const eng = await prisma.department.create({
      data: {
        company_id: company.id,
        name: 'Engineering',
        description: 'Field & technical ops',
      },
    });
    const ops = await prisma.department.create({
      data: {
        company_id: company.id,
        name: 'Operations',
        description: 'Day-to-day operations',
        parent_department_id: eng.id,
      },
    });
    const hr = await prisma.department.create({
      data: {
        company_id: company.id,
        name: 'HR',
        description: 'People ops',
      },
    });

    const ownerMember = await prisma.companyMember.create({
      data: {
        user_id: owner.id,
        company_id: company.id,
        department_id: hr.id,
        platform_type: 'EMPLOYER',
        role_id: roleIds.OWNER,
        is_active: true,
      },
    });

    await seedCompanySettings(company.id, { gst: def.gst, verified: def.verified });
    const designations = await seedDesignations(company.id);
    const workShifts = await seedWorkShifts(company.id);
    await seedCompanyHolidays(company.id);

    companies.push({
      company,
      owner,
      roleIds,
      eng,
      ops,
      hr,
      ownerMember,
      designations,
      workShifts,
    });
    owners.push(owner);
  }

  // -------------------------------------------------------------------------
  // HR workforce (workforce_persons) + employments — no User rows on onboard
  // -------------------------------------------------------------------------
  const primary = companies[0];

  const { member: managerMember } = await createEmploymentStint({
    fullName: workerPool[2].name,
    phone: workerPool[2].phone,
    karigariId: workerPool[2].karigariId,
    companyId: primary.company.id,
    departmentId: primary.eng.id,
    roleId: primary.roleIds.MANAGER,
    managerMemberId: primary.ownerMember.id,
    employeeNo: 'EMP-MGR',
    joinedAt: daysFromNow(-200),
    isActive: true,
    designationId: primary.designations[0]?.id,
    seedAddresses: true,
    city: workerPool[2].city,
  });

  const team = await prisma.team.create({
    data: {
      department_id: primary.ops.id,
      name: 'Night Shift Team',
      lead_company_member_id: managerMember.id,
    },
  });

  const employeeMembers = [];
  for (let i = 0; i < workerPool.length; i++) {
    if (i === 2) continue; // manager already created
    const roleId =
      i === 0 ? primary.roleIds.SITE_SUPERVISOR : i === 1 ? primary.roleIds.TEAM_LEAD : primary.roleIds.EMPLOYEE;
    const w = workerPool[i];
    const { member } = await createEmploymentStint({
      fullName: w.name,
      phone: w.phone,
      karigariId: w.karigariId,
      companyId: primary.company.id,
      departmentId: primary.ops.id,
      teamId: team.id,
      roleId,
      managerMemberId: managerMember.id,
      employeeNo: `EMP-${String(i + 1).padStart(3, '0')}`,
      joinedAt: daysFromNow(-(30 + i * 10)),
      isActive: true,
      designationId: primary.designations[i % primary.designations.length]?.id,
      seedAddresses: i < 2,
      city: w.city,
    });
    employeeMembers.push(member);
  }

  // App users for marketplace / shift swap (first 5 workers — last 2 stay HR-only)
  const APP_LINKED_WORKER_COUNT = 5;
  const appWorkers = [];
  for (let i = 0; i < APP_LINKED_WORKER_COUNT; i++) {
    const w = workerPool[i];
    const { user } = await linkAppUserForWorkforcePerson({
      phone: w.phone,
      userData: {
        name: w.name,
        phone_no: w.phone,
        email: `worker${i + 1}@kbdl.dev`,
        karigari_id: w.karigariId,
        city: w.city,
        skills: w.skills,
        experience: 1 + (i % 6),
        preferences: { language: 'en-IN', theme: 'system' },
        rating_avg: 3.5 + (i % 15) / 10,
        rating_count: 2 + i * 3,
        verification_level: 1,
        extra_shift: true,
      },
    });
    appWorkers.push(user);
  }

  // HR attendance + OT sample data (primary company field staff)
  await seedAttendanceForCompany({
    companyId: primary.company.id,
    workShifts: primary.workShifts,
    members: [managerMember, ...employeeMembers],
    markedByMemberId: primary.ownerMember.id,
  });

  await seedLeaveForCompany(primary.company.id);
  await seedJulyPayrollMonth(prisma);

  // Office staff on primary — every system role used via role_id (not strings)
  const officeStaff = [
    { name: 'Neha Admin', email: 'admin.staff@kbdl.dev', phone: '+919870000001', role: 'ADMIN', dept: 'hr' },
    { name: 'Kiran HR', email: 'hr.staff@kbdl.dev', phone: '+919870000002', role: 'HR', dept: 'hr' },
    { name: 'Meera Recruiter', email: 'recruiter@kbdl.dev', phone: '+919870000003', role: 'RECRUITER', dept: 'hr' },
    { name: 'Vik Finance', email: 'finance@kbdl.dev', phone: '+919870000004', role: 'FINANCE', dept: 'ops' },
    { name: 'Sana Payroll', email: 'payroll@kbdl.dev', phone: '+919870000005', role: 'PAYROLL_CLERK', dept: 'ops' },
  ];

  for (const s of officeStaff) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        phone_no: s.phone,
        city: 'Chandigarh',
        skills: [],
        preferences: { language: 'en-IN', theme: 'system' },
        verification_level: 1,
        extra_shift: false,
      },
    });
    await prisma.companyMember.create({
      data: {
        user_id: user.id,
        company_id: primary.company.id,
        department_id: s.dept === 'hr' ? primary.hr.id : primary.ops.id,
        platform_type: 'EMPLOYER',
        role_id: primary.roleIds[s.role],
        manager_company_member_id: primary.ownerMember.id,
        is_active: true,
      },
    });
  }

  // Second company: ADMIN + WAREHOUSE_LEAD members (own users; one company per user)
  {
    const co = companies[1];
    const adminUser = await prisma.user.create({
      data: {
        name: 'Aryan Admin',
        email: 'aryan.admin@kbdl.dev',
        phone_no: '+919870000010',
        city: 'Jalandhar',
        skills: [],
        preferences: { language: 'en-IN' },
        verification_level: 1,
        extra_shift: false,
      },
    });
    await prisma.companyMember.create({
      data: {
        user_id: adminUser.id,
        company_id: co.company.id,
        department_id: co.hr.id,
        platform_type: 'EMPLOYER',
        role_id: co.roleIds.ADMIN,
        manager_company_member_id: co.ownerMember.id,
        is_active: true,
      },
    });
    await createEmploymentStint({
      fullName: 'Warehouse Lead AC',
      phone: '+919870000011',
      karigariId: 'KG-AC-WH',
      companyId: co.company.id,
      departmentId: co.ops.id,
      roleId: co.roleIds.WAREHOUSE_LEAD,
      managerMemberId: co.ownerMember.id,
      employeeNo: 'AC-WH-01',
      joinedAt: daysFromNow(-60),
      isActive: true,
      designationId: co.designations[0]?.id,
      city: 'Jalandhar',
    });
  }

  // Past employments at Aryan Corp (workers now active at KBDL — HR history demo)
  const aryan = companies[1];
  for (let i = 0; i < 2; i++) {
    const w = workerPool[i];
    await createEmploymentStint({
      fullName: w.name,
      phone: w.phone,
      karigariId: w.karigariId,
      companyId: aryan.company.id,
      departmentId: aryan.ops.id,
      roleId: aryan.roleIds.EMPLOYEE,
      managerMemberId: aryan.ownerMember.id,
      employeeNo: `AC-PAST-${i + 1}`,
      joinedAt: daysFromNow(-400),
      leftAt: daysFromNow(-120),
      isActive: false,
      separationReason: i === 0 ? 'resigned' : 'terminated',
      designationId: aryan.designations[0]?.id,
    });
  }

  // -------------------------------------------------------------------------
  // Jobs (~12)
  // -------------------------------------------------------------------------
  const jobTitles = [
    ['Electrician', 'full_time', 'onsite', 'open'],
    ['Loader', 'contract', 'onsite', 'open'],
    ['Plumber', 'full_time', 'remote', 'open'],
    ['AC Technician', 'part_time', 'onsite', 'open'],
    ['Welder', 'full_time', 'onsite', 'paused'],
    ['Helper', 'temporary', 'onsite', 'open'],
    ['Supervisor', 'full_time', 'hybrid', 'draft'],
    ['Inventory Clerk', 'part_time', 'onsite', 'closed'],
    ['Driver', 'contract', 'onsite', 'open'],
    ['Packer', 'freelance', 'onsite', 'open'],
    ['Site Engineer', 'full_time', 'onsite', 'open'],
    ['Security Guard', 'full_time', 'onsite', 'expired'],
  ];

  const jobs = [];
  for (let i = 0; i < jobTitles.length; i++) {
    const [title, employment_type, work_type, status] = jobTitles[i];
    const co = i < 8 ? primary : companies[1];
    const job = await prisma.job.create({
      data: {
        company_id: co.company.id,
        department_id: co.ops?.id ?? co.eng.id,
        created_by_company_member_id: co.ownerMember.id,
        title,
        description: `${title} needed for field operations at ${co.company.company_name}.`,
        employment_type,
        work_type,
        salary_min: 15000 + i * 500,
        salary_max: 25000 + i * 500,
        salary_type: 'monthly',
        is_negotiable: i % 2 === 0,
        address: co.company.company_address,
        seats_available: 3 + (i % 5),
        status,
        expires_at: status === 'expired' ? daysFromNow(-2) : daysFromNow(20 + i),
        job_start_time: daysFromNow(3 + i),
      },
    });
    jobs.push(job);
  }

  // Job applications (dump had 0 — seed a few for ATS UI)
  await prisma.jobApplication.createMany({
    data: [
      {
        job_id: jobs[0].id,
        user_id: appWorkers[0].id,
        status: 'under_review',
        cover_letter: '4 years industrial wiring experience.',
        applied_at: daysFromNow(-2),
        reviewed_at: daysFromNow(-1),
      },
      {
        job_id: jobs[0].id,
        user_id: appWorkers[1].id,
        status: 'applied',
        cover_letter: 'Available immediately.',
        applied_at: daysFromNow(-1),
      },
      {
        job_id: jobs[1].id,
        user_id: appWorkers[3].id,
        status: 'shortlisted',
        cover_letter: 'Strong loader background.',
        applied_at: daysFromNow(-5),
        shortlisted_at: daysFromNow(-2),
      },
    ],
  });

  // -------------------------------------------------------------------------
  // Shifts (~140) + applications (~150)
  // -------------------------------------------------------------------------
  console.log('📦 Creating shifts & applications...');
  const shiftStatuses = ['open', 'approved', 'completed', 'cancelled', 'rejected', 'absent'];
  const skills = ['Electrician', 'Helper', 'Plumber', 'AC Technician', 'Welder', 'Loader'];
  const shiftIds = [];

  for (let i = 0; i < 141; i++) {
    const worker = appWorkers[i % appWorkers.length];
    const status = shiftStatuses[i % shiftStatuses.length];
    const day = daysFromNow((i % 40) - 10);
    const start = atHour(day, 9 + (i % 8));
    const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
    const co = i % 5 === 0 ? companies[1] : primary;

    const shift = await prisma.shift.create({
      data: {
        company_id: co.company.id,
        department_id: co.ops?.id ?? co.eng.id,
        team_id: co.company.id === primary.company.id ? team.id : null,
        created_by_company_member_id: co.ownerMember.id,
        assigned_company_member_id:
          co.company.id === primary.company.id ? employeeMembers[i % employeeMembers.length]?.id : null,
        original_employee_id: worker.id,
        replacement_employee_id: status === 'approved' ? appWorkers[(i + 1) % appWorkers.length].id : null,
        created_by: i % 7 === 0 ? 'EMPLOYEE' : 'EMPLOYER',
        request_accepted: status === 'approved' || status === 'completed',
        shift_date: day,
        shift_start: start,
        shift_end: end,
        payType: i % 2 === 0 ? 'HOURLY' : 'FIXED',
        shift_pay: i % 2 === 0 ? 150 + (i % 50) : 1000 + (i % 20) * 50,
        skill_required: skills[i % skills.length],
        status,
        organization_approved: status !== 'open',
        no_show_reported: status === 'absent',
      },
    });
    shiftIds.push(shift.id);
  }

  const appRows = [];
  for (let i = 0; i < 150; i++) {
    const shiftId = shiftIds[i % shiftIds.length];
    const user = appWorkers[i % appWorkers.length];
    appRows.push({
      shift_id: shiftId,
      user_id: user.id,
      type: i % 3 === 0 ? 'invited' : 'applied',
      status: ['pending', 'accepted', 'rejected', 'withdrawn'][i % 4],
    });
  }
  // unique (shift_id, user_id) — dedupe
  const seen = new Set();
  const uniqueApps = [];
  for (const row of appRows) {
    const key = `${row.shift_id}:${row.user_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueApps.push(row);
  }
  await prisma.shiftApplication.createMany({ data: uniqueApps });

  // -------------------------------------------------------------------------
  // Ratings (~36)
  // -------------------------------------------------------------------------
  for (let i = 0; i < 36; i++) {
    const to = appWorkers[i % appWorkers.length];
    const from = owners[0];
    try {
      await prisma.rating.create({
        data: {
          from_user_id: from.id,
          to_user_id: to.id,
          from_company_member_id: primary.ownerMember.id,
          company_id: primary.company.id,
          shift_id: shiftIds[i % shiftIds.length],
          score: 3 + (i % 3),
          review: i % 2 === 0 ? 'Good performance on shift.' : null,
          flagged_issue: i % 11 === 0,
        },
      });
    } catch {
      /* unique constraint skip */
    }
  }

  // -------------------------------------------------------------------------
  // Billing
  // -------------------------------------------------------------------------
  const employerPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Employer Premium',
      target: 'company',
      price: 2999,
      billing_cycle: 'monthly',
      features: { jobs: true, shifts: true, analytics: true },
      is_active: true,
    },
  });
  const workerPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Worker Basic',
      target: 'worker',
      price: 99,
      billing_cycle: 'monthly',
      features: { shift_alerts: true },
      is_active: true,
    },
  });

  const sub = await prisma.subscriptions.create({
    data: {
      company_id: primary.company.id,
      plan_id: employerPlan.id,
      subscription_platform_type: 'EMPLOYER',
      status: 'active',
      starts_at: daysFromNow(-10),
      expires_at: daysFromNow(20),
    },
  });
  await prisma.subscriptions.create({
    data: {
      user_id: appWorkers[0].id,
      plan_id: workerPlan.id,
      subscription_platform_type: 'EMPLOYEE',
      status: 'active',
      starts_at: daysFromNow(-5),
      expires_at: daysFromNow(25),
    },
  });

  const order = await prisma.order.create({
    data: {
      company_id: primary.company.id,
      order_platform_type: 'EMPLOYER',
      order_date: daysFromNow(-10),
      total_price: 2999,
      payment_status: 'paid',
      shipping_address: primary.company.company_address,
    },
  });

  await prisma.transaction.create({
    data: {
      company_id: primary.company.id,
      subscription_id: sub.id,
      order_id: order.id,
      type: 'payment',
      transaction_platform_type: 'EMPLOYER',
      amount: 2999,
      status: 'success',
      payment_mode: 'upi',
      razorpay_payment_id: 'pay_seed_001',
      razorpay_order_id: 'order_seed_001',
    },
  });

  // -------------------------------------------------------------------------
  // Notifications / tokens / prefs (dump ≈158 notifs, 55 push tokens)
  // -------------------------------------------------------------------------
  for (const u of [...owners.slice(0, 3), ...appWorkers]) {
    await prisma.notificationPreference.create({
      data: { user_id: u.id, shiftSwap: true, jobAlert: true },
    });
  }

  for (let i = 0; i < 55; i++) {
    const u = appWorkers[i % appWorkers.length];
    try {
      await prisma.pushToken.create({
        data: {
          user_id: u.id,
          token: `ExponentPushToken[seed-${i}-${u.id.slice(0, 8)}]`,
          platform: i % 2 === 0 ? 'android' : 'ios',
          deviceId: `seed-device-${i}`,
          isActive: i % 7 !== 0,
        },
      });
    } catch {
      /* unique token */
    }
  }

  const notifRows = [];
  for (let i = 0; i < 158; i++) {
    const u = i % 2 === 0 ? owners[0] : appWorkers[i % appWorkers.length];
    notifRows.push({
      user_id: u.id,
      type: i % 2 === 0 ? 'shift_swap_request' : 'job_application_update',
      title: i % 2 === 0 ? 'Shift update' : 'Application update',
      body: `Seed notification #${i + 1}`,
      data: { index: i },
      isRead: i % 3 === 0,
    });
  }
  await prisma.notification.createMany({ data: notifRows });

  // -------------------------------------------------------------------------
  // Leads (~14) + OTP + Admin
  // -------------------------------------------------------------------------
  const leadNames = [
    'Suresh Patel',
    'Aryan Raj',
    'Alok Kumar',
    'Anshika Mishra',
    'Test Lead',
    'Rina Shah',
    'Vikram Joshi',
    'Neha Gupta',
    'Karan Mehta',
    'Pooja Rani',
    'Imran Ali',
    'Deepak Verma',
    'Sneha Kapoor',
    'Rohit Das',
  ];
  await prisma.lead.createMany({
    data: leadNames.map((fullName, i) => ({
      fullName,
      email: `lead${i + 1}@example.com`,
      mobileNumber: `+91999${String(1000000 + i).slice(0, 7)}`,
      subject: i % 2 === 0 ? 'Partnership inquiry' : 'Staffing need',
      message: `Hello KBDL, interested in services (${fullName}).`,
      isResolved: i % 5 === 0,
    })),
  });

  await prisma.otpVerification.create({
    data: {
      email: 'employer@kbdl.dev',
      otp: '123456',
      role: 'EMPLOYER_LOGIN',
      payload: {},
      expires_at: daysFromNow(1),
    },
  });

  await prisma.admin.create({
    data: {
      name: 'KBDL Admin',
      email: 'admin@kbdl.dev',
      phone_no: '+919000000000',
      role: 'admin',
      password_hash: '$2b$10$y0YAbrACxPW.efOpZy/fQeErK53/sURpIQxwEywLc/2dTX/f1m.1i',
    },
  });
  await prisma.admin.create({
    data: {
      name: 'mdarif',
      email: 'mdarif@kbdl.dev',
      phone_no: '+919876540001',
      role: 'admin',
      password_hash: '$2b$10$U4BCrpIw2UqFZhxZLOgRduNalk.4ALfxUUdfPq1sGpy1tE./lkmV2',
    },
  });

  const roleCount = await prisma.companyRole.count();
  const shiftCount = await prisma.shift.count();
  const appCount = await prisma.shiftApplication.count();
  const memberCount = await prisma.companyMember.count();
  const deptCount = await prisma.department.count();
  const payrollSettingsCount = await prisma.payrollSettings.count();
  const statutorySettingsCount = await prisma.statutorySettings.count();
  const paymentSettingsCount = await prisma.paymentSettings.count();
  const workScheduleCount = await prisma.companyWorkSchedule.count();
  const overtimeSettingsCount = await prisma.overtimeSettings.count();
  const workShiftCount = await prisma.workShift.count();
  const employeeShiftCount = await prisma.employeeShift.count();
  const attendanceCount = await prisma.attendance.count();
  const holidayCount = await prisma.companyHoliday.count();
  const workforcePersonCount = await prisma.workforcePerson.count();
  const hrOnlyWorkerCount = workerPool.length - appWorkers.length;

  console.log('');
  console.log('✅ Seed complete');
  console.log('────────────────────────────────────────');
  console.log(`Companies            : ${companies.length}`);
  console.log(`Departments          : ${deptCount}  (per-company)`);
  console.log(`Company roles        : ${roleCount}  (8 system + 3 custom × companies)`);
  console.log(`Company members      : ${memberCount}  (all via role_id)`);
  console.log(`Payroll settings     : ${payrollSettingsCount}`);
  console.log(`Statutory settings   : ${statutorySettingsCount}`);
  console.log(`Payment settings     : ${paymentSettingsCount}`);
  console.log(`Work schedules       : ${workScheduleCount}`);
  console.log(`Overtime settings    : ${overtimeSettingsCount}`);
  console.log(`Work shifts (HR)     : ${workShiftCount}`);
  console.log(`Employee shifts      : ${employeeShiftCount}`);
  console.log(`Attendances          : ${attendanceCount}`);
  console.log(`Company holidays     : ${holidayCount}`);
  console.log(`Workforce persons    : ${workforcePersonCount}  (HR identity)`);
  console.log(`App-linked workers   : ${appWorkers.length}`);
  console.log(`HR-only workers      : ${hrOnlyWorkerCount}  (no app User yet)`);
  console.log(`Jobs                 : ${jobs.length}`);
  console.log(`Marketplace shifts   : ${shiftCount}`);
  console.log(`Shift applications   : ${appCount}`);
  console.log('Employer login email : employer@kbdl.dev');
  console.log('Employer phone       : +919876543210');
  console.log('Worker phone (app)   : +919876543211');
  console.log('HR-only worker phone : +917275890926  (Arif — no User row)');
  console.log('Local OTP (login)    : 123456');
  console.log('────────────────────────────────────────');
  console.log('HR employments use workforce_persons; app User rows are linked separately.');
  console.log('Departments & roles are per-company catalogs.');
  console.log('Members store role_id only — rename CompanyRole.name without rewriting members.');
  console.log('HR: work_shifts ≠ marketplace shifts. Attendance keyed by company_member_id + date.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
