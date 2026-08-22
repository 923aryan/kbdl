/**
 * Seeds a complete July calendar (default 2026) so payroll can be tested:
 * attendance every day, week-offs, holiday, leave, OT, absents, plus wage/bank/PF fields.
 *
 * Does not wipe the rest of the database. Re-running replaces that month's attendance
 * and deletes that month's payroll run so the UI can rebuild it from the new snapshot.
 *
 *   pnpm --filter @repo/db run seed:july-payroll
 */
import { loadDbEnv } from '../scripts/resolve-database-url.mjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';

const YEAR = 2026;
const MONTH = 7; // July
const HOLIDAY_DAY = 17;

function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

function tsOnDate(date, hour, minute = 0) {
  const d = new Date(date);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

function lastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pickShift(workShifts, index) {
  const list = [workShifts.general, workShifts.morning, workShifts.evening, workShifts.night].filter(Boolean);
  return list[index % Math.max(list.length, 1)];
}

function clockTime(hour, minute = 0) {
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
}

async function ensureWorkShifts(prisma, companyId) {
  const existing = await prisma.workShift.findMany({
    where: { company_id: companyId, is_active: true },
    orderBy: { sort_order: 'asc' },
  });
  const byName = Object.fromEntries(existing.map((row) => [row.name.toLowerCase(), row]));
  if (existing.length === 0) {
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
    return { general, morning: general, evening: general, night: general };
  }
  const fallback = existing[0];
  return {
    general: byName.general ?? fallback,
    morning: byName.morning ?? fallback,
    evening: byName.evening ?? fallback,
    night: byName.night ?? fallback,
  };
}

function wagePayload(index) {
  const daily = index % 2 === 0;
  const dailyRate = 750 + (index % 5) * 50;
  const monthly = dailyRate * 26;
  const last4 = String(1000 + index * 17).slice(-4);
  return {
    employee_type: index % 3 === 0 ? 'contract' : 'full_time',
    basic_salary: daily ? dailyRate : monthly,
    salary_type: daily ? 'daily' : 'monthly',
    salary_payment_frequency: 'monthly',
    overtime_eligible: true,
    pf_applicable: index % 4 !== 3,
    esi_applicable: index % 3 !== 2,
    payment_method: index % 5 === 0 ? 'upi' : 'bank',
    pan_number: `ABCDE${String(1000 + index).slice(-4)}F`,
    payment_details: {
      bank_name: index % 2 === 0 ? 'SBI' : 'HDFC',
      account_number: `8823${last4}${last4}`,
      ifsc_code: index % 2 === 0 ? 'SBIN0001234' : 'HDFC0001234',
      account_holder_name: 'Worker',
      upi_id: index % 5 === 0 ? `worker${index}@upi` : undefined,
      ot_rate_per_hour: Math.round((dailyRate / 8) * 1.5),
      allowance: index % 4 === 0 ? 500 : 150,
    },
  };
}

function dayKind(memberIndex, day) {
  const date = utcDate(YEAR, MONTH, day);
  if (date.getUTCDay() === 0) return 'week_off';
  if (day === HOLIDAY_DAY) return 'holiday';
  if (memberIndex === 0 && (day === 8 || day === 9)) return 'leave';
  if (memberIndex === 1 && day === 22) return 'leave';
  const pattern = (memberIndex + day) % 11;
  if (pattern === 0) return 'absent';
  if (pattern === 1) return 'half_day';
  if (pattern === 2) return 'ot';
  return 'present';
}

function attendanceRow({ companyId, memberId, shiftId, markedById, date, kind }) {
  const base = {
    company_id: companyId,
    company_member_id: memberId,
    work_shift_id: shiftId,
    date,
    source: kind === 'week_off' || kind === 'holiday' ? 'system' : 'hr_manual',
    marked_by_company_member_id: kind === 'week_off' || kind === 'holiday' ? null : markedById,
    lunch_break_minutes: 0,
    tea_break_minutes: 0,
    is_ot: false,
    shift_mismatch: false,
  };

  if (kind === 'week_off') {
    return { ...base, status: 'week_off', check_in: null, check_out: null, worked_minutes: 0, ot_minutes: 0, notes: null };
  }
  if (kind === 'holiday') {
    return {
      ...base,
      status: 'holiday',
      check_in: null,
      check_out: null,
      worked_minutes: 0,
      ot_minutes: 0,
      notes: 'Company Foundation Day',
    };
  }
  if (kind === 'leave') {
    return { ...base, status: 'leave', check_in: null, check_out: null, worked_minutes: 0, ot_minutes: 0, notes: 'Approved leave' };
  }
  if (kind === 'absent') {
    return { ...base, status: 'absent', check_in: null, check_out: null, worked_minutes: 0, ot_minutes: 0, notes: 'No show' };
  }
  if (kind === 'half_day') {
    return {
      ...base,
      status: 'half_day',
      check_in: tsOnDate(date, 9, 5),
      check_out: tsOnDate(date, 13, 0),
      worked_minutes: 235,
      ot_minutes: 0,
      notes: null,
    };
  }
  if (kind === 'ot') {
    return {
      ...base,
      status: 'present',
      check_in: tsOnDate(date, 9, 0),
      check_out: tsOnDate(date, 21, 0),
      worked_minutes: 600,
      ot_minutes: 120,
      is_ot: true,
      ot_reason: 'Peak production',
      notes: 'OT approved',
    };
  }
  return {
    ...base,
    status: 'present',
    check_in: tsOnDate(date, 9, 0),
    check_out: tsOnDate(date, 18, 0),
    worked_minutes: 480,
    ot_minutes: 0,
    notes: null,
  };
}

async function seedJulyLeave(prisma, companyId, employments) {
  let casual = await prisma.companyLeaveType.findFirst({
    where: { company_id: companyId, name: { equals: 'Casual Leave', mode: 'insensitive' } },
  });
  if (!casual) {
    await prisma.companyLeavePolicy.upsert({
      where: { company_id: companyId },
      update: {},
      create: { company_id: companyId },
    });
    casual = await prisma.companyLeaveType.create({
      data: { company_id: companyId, name: 'Casual Leave', days_per_year: 12, sort_order: 10 },
    });
  }

  const from = utcDate(YEAR, MONTH, 1);
  const to = utcDate(YEAR, MONTH, lastDayOfMonth(YEAR, MONTH));
  await prisma.leaveRequest.deleteMany({
    where: { company_id: companyId, from_date: { gte: from, lte: to } },
  });

  const rows = [];
  if (employments[0]) {
    rows.push({
      company_id: companyId,
      employment_id: employments[0].id,
      leave_type_id: casual.id,
      from_date: utcDate(YEAR, MONTH, 8),
      to_date: utcDate(YEAR, MONTH, 9),
      days: 2,
      reason: 'Personal work (July payroll seed)',
      status: 'approved',
      applied_by_kind: 'hr',
      applied_at: utcDate(YEAR, MONTH, 6),
      decided_at: utcDate(YEAR, MONTH, 6),
    });
  }
  if (employments[1]) {
    rows.push({
      company_id: companyId,
      employment_id: employments[1].id,
      leave_type_id: casual.id,
      from_date: utcDate(YEAR, MONTH, 22),
      to_date: utcDate(YEAR, MONTH, 22),
      days: 1,
      reason: 'Family function (July payroll seed)',
      status: 'approved',
      applied_by_kind: 'hr',
      applied_at: utcDate(YEAR, MONTH, 20),
      decided_at: utcDate(YEAR, MONTH, 20),
    });
  }
  if (rows.length) await prisma.leaveRequest.createMany({ data: rows });
  return rows.length;
}

export async function seedJulyPayrollMonth(prisma, { year = YEAR, month = MONTH } = {}) {
  const start = utcDate(year, month, 1);
  const end = utcDate(year, month, lastDayOfMonth(year, month));
  const companies = await prisma.company.findMany({
    select: { id: true, company_name: true },
    orderBy: { created_at: 'asc' },
  });

  const summary = [];

  for (const company of companies) {
    const members = await prisma.companyMember.findMany({
      where: { company_id: company.id, is_active: true, employment_id: { not: null } },
      include: {
        employment: { include: { hr_profile: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    if (members.length === 0) continue;

    const marker =
      (await prisma.companyMember.findFirst({
        where: {
          company_id: company.id,
          is_active: true,
          role: { code: { in: ['OWNER', 'ADMIN', 'HR'] } },
        },
        orderBy: { created_at: 'asc' },
        select: { id: true },
      })) ?? members[0];

    const workShifts = await ensureWorkShifts(prisma, company.id);

    await prisma.companyHoliday.upsert({
      where: { company_id_date: { company_id: company.id, date: utcDate(year, month, HOLIDAY_DAY) } },
      update: { name: 'Company Foundation Day' },
      create: {
        company_id: company.id,
        date: utcDate(year, month, HOLIDAY_DAY),
        name: 'Company Foundation Day',
        is_optional: false,
      },
    });

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const shift = pickShift(workShifts, i);
      const existing = await prisma.employeeShift.findFirst({
        where: { company_member_id: member.id, effective_to: null },
      });
      if (!existing && shift) {
        await prisma.employeeShift.create({
          data: {
            company_id: company.id,
            company_member_id: member.id,
            work_shift_id: shift.id,
            effective_from: start,
            effective_to: null,
          },
        });
      }

      const hr = member.employment?.hr_profile;
      if (hr) {
        const payload = wagePayload(i);
        await prisma.employeeHrProfile.update({
          where: { id: hr.id },
          data: {
            ...payload,
            payment_details: {
              ...payload.payment_details,
              account_holder_name: hr.full_name,
            },
          },
        });
      }
    }

    await prisma.payrollRun.deleteMany({
      where: { company_id: company.id, period_year: year, period_month: month },
    });
    await prisma.attendance.deleteMany({
      where: { company_id: company.id, date: { gte: start, lte: end } },
    });

    const rows = [];
    const days = lastDayOfMonth(year, month);
    for (let day = 1; day <= days; day++) {
      const date = utcDate(year, month, day);
      for (let mi = 0; mi < members.length; mi++) {
        const shift = pickShift(workShifts, mi);
        rows.push(
          attendanceRow({
            companyId: company.id,
            memberId: members[mi].id,
            shiftId: shift.id,
            markedById: marker.id,
            date,
            kind: dayKind(mi, day),
          }),
        );
      }
    }

    const chunk = 200;
    for (let i = 0; i < rows.length; i += chunk) {
      await prisma.attendance.createMany({ data: rows.slice(i, i + chunk), skipDuplicates: true });
    }

    const leaveCount = await seedJulyLeave(
      prisma,
      company.id,
      members.map((m) => m.employment).filter(Boolean),
    );

    summary.push({
      company: company.company_name,
      workers: members.length,
      attendance: rows.length,
      leave: leaveCount,
    });
  }

  return summary;
}

async function runCli() {
  const connectionString = loadDbEnv();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  console.log('🌱 Seeding July 2026 payroll/attendance data...');
  console.log('DB:', connectionString.replace(/:[^:@]+@/, ':****@'));
  try {
    const summary = await seedJulyPayrollMonth(prisma);
    if (summary.length === 0) {
      console.log('No companies with active employees were found.');
      return;
    }
    console.log('');
    console.log('✅ July 2026 seed complete');
    for (const row of summary) {
      console.log(`  ${row.company}: ${row.workers} workers, ${row.attendance} attendance rows, ${row.leave} leave requests`);
    }
    console.log('');
    console.log('Open Payroll → Run Payroll and pick July 2026.');
  } finally {
    await prisma.$disconnect();
  }
}

const isDirect = process.argv[1]?.includes('seed-july-payroll');
if (isDirect) {
  runCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
