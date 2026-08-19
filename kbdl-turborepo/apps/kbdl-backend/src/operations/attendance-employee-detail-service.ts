import { prisma } from '@repo/db/server';
import type { EmployeeAttendanceMonth } from '@repo/types';
import { AppError } from '../utils/api-error';
import {
  attendanceStatusLabel,
  formatMinutesAsHours,
  formatTimeLog,
} from './attendance-utils';

const DAY_PRIORITY: Record<string, number> = {
  absent: 1,
  leave: 2,
  half_day: 3,
  present: 4,
  on_duty: 5,
  holiday: 6,
  week_off: 7,
};

const STATUS_CODE: Record<string, string> = {
  present: 'P',
  on_duty: 'P',
  absent: 'A',
  half_day: 'HD',
  leave: 'L',
  holiday: 'H',
  week_off: 'OF',
  pending: '-',
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function eachUtcDate(from: string, to: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (cursor <= end) {
    days.push(isoDay(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function isWorkingWeekday(
  iso: string,
  schedule: {
    monday_working: boolean;
    tuesday_working: boolean;
    wednesday_working: boolean;
    thursday_working: boolean;
    friday_working: boolean;
    saturday_working: boolean;
    sunday_working: boolean;
  } | null,
): boolean {
  const dow = new Date(`${iso}T00:00:00.000Z`).getUTCDay(); // 0 Sun
  if (!schedule) return dow !== 0;
  const map = [
    schedule.sunday_working,
    schedule.monday_working,
    schedule.tuesday_working,
    schedule.wednesday_working,
    schedule.thursday_working,
    schedule.friday_working,
    schedule.saturday_working,
  ];
  return map[dow] ?? true;
}

function pickDayStatus(rows: Array<{ status: string }>): string | null {
  if (!rows.length) return null;
  return [...rows].sort(
    (a, b) => (DAY_PRIORITY[a.status] ?? 9) - (DAY_PRIORITY[b.status] ?? 9),
  )[0]!.status;
}

export async function getEmployeeAttendanceMonthService(
  companyId: string,
  employmentId: string,
  range: { from: string; to: string },
): Promise<EmployeeAttendanceMonth> {
  const employment = await prisma.employeeEmployment.findFirst({
    where: { id: employmentId, company_id: companyId },
    select: {
      id: true,
      employee_no: true,
      company_member: { select: { id: true, department: { select: { name: true } } } },
      hr_profile: {
        select: {
          full_name: true,
          designation: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
      workforce_person: { select: { phone_no: true } },
    },
  });

  if (!employment?.company_member) {
    throw new AppError(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found for this company');
  }

  const memberId = employment.company_member.id;
  const fromDate = new Date(`${range.from}T00:00:00.000Z`);
  const toDate = new Date(`${range.to}T00:00:00.000Z`);

  const [schedule, holidays, assignedShift, attendances] = await Promise.all([
    prisma.companyWorkSchedule.findUnique({
      where: { company_id: companyId },
    }),
    prisma.companyHoliday.findMany({
      where: { company_id: companyId, date: { gte: fromDate, lte: toDate } },
      select: { date: true, name: true, is_optional: true },
    }),
    prisma.employeeShift.findFirst({
      where: {
        company_member_id: memberId,
        effective_from: { lte: toDate },
        OR: [{ effective_to: null }, { effective_to: { gte: fromDate } }],
      },
      orderBy: { effective_from: 'desc' },
      include: {
        work_shift: {
          select: { id: true, name: true, start_time: true, end_time: true, break_minutes: true },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { company_id: companyId, company_member_id: memberId, date: { gte: fromDate, lte: toDate } },
      include: {
        work_shift: {
          select: { id: true, name: true, start_time: true, end_time: true, break_minutes: true },
        },
      },
      orderBy: [{ date: 'asc' }, { created_at: 'asc' }],
    }),
  ]);

  const holidayByDay = new Map(
    holidays.map((h) => [isoDay(h.date), { name: h.name, is_optional: h.is_optional }]),
  );

  const byDate = new Map<string, typeof attendances>();
  for (const row of attendances) {
    const key = isoDay(row.date);
    const list = byDate.get(key) ?? [];
    list.push(row);
    byDate.set(key, list);
  }

  const days = eachUtcDate(range.from, range.to).map((date) => {
    const rows = byDate.get(date) ?? [];
    const holiday = holidayByDay.get(date) ?? null;
    const working = isWorkingWeekday(date, schedule);
    const marked = pickDayStatus(rows);
    let status = marked;
    if (!status) {
      if (holiday) status = 'holiday';
      else if (!working) status = 'week_off';
      else status = 'pending';
    }

    const otMinutes = rows.reduce((sum, r) => sum + (r.is_ot ? r.ot_minutes : 0), 0);
    const workedMinutes = rows.reduce((sum, r) => sum + r.worked_minutes, 0);

    return {
      date,
      status,
      status_label: status === 'pending' ? 'Pending' : attendanceStatusLabel(status),
      code: STATUS_CODE[status] ?? '-',
      holiday_name: holiday?.name ?? null,
      is_working_day: working && !holiday,
      shift_count: rows.length,
      ot_minutes: otMinutes,
      worked_minutes: workedMinutes,
    };
  });

  const summary = {
    present: days.filter((d) => d.status === 'present' || d.status === 'on_duty').length,
    absent: days.filter((d) => d.status === 'absent').length,
    half_day: days.filter((d) => d.status === 'half_day').length,
    leave: days.filter((d) => d.status === 'leave').length,
    holiday: days.filter((d) => d.status === 'holiday').length,
    week_off: days.filter((d) => d.status === 'week_off').length,
    pending: days.filter((d) => d.status === 'pending').length,
    ot_minutes: days.reduce((sum, d) => sum + d.ot_minutes, 0),
    worked_minutes: days.reduce((sum, d) => sum + d.worked_minutes, 0),
  };

  const eligible = summary.present + summary.half_day + summary.absent + summary.leave;
  const attendanceRate =
    eligible === 0 ? 0 : Math.round(((summary.present + summary.half_day * 0.5) / eligible) * 1000) / 10;

  const entries = attendances.map((row) => ({
    id: row.id,
    date: isoDay(row.date),
    shift_name: row.work_shift.name,
    check_in: row.check_in?.toISOString() ?? null,
    check_out: row.check_out?.toISOString() ?? null,
    time_log: formatTimeLog(row.check_in, row.check_out),
    worked_hours_label: formatMinutesAsHours(row.worked_minutes),
    lunch_break_minutes: row.lunch_break_minutes,
    tea_break_minutes: row.tea_break_minutes,
    ot_minutes: row.ot_minutes,
    overtime_label: row.is_ot ? formatMinutesAsHours(row.ot_minutes) : '-',
    is_ot: row.is_ot,
    ot_reason: row.ot_reason,
    status: row.status,
    status_label: attendanceStatusLabel(row.status),
    source: row.source,
    notes: row.notes,
    shift_mismatch: row.shift_mismatch,
  }));

  const assigned = assignedShift?.work_shift
    ? {
        id: assignedShift.work_shift.id,
        name: assignedShift.work_shift.name,
        start_time: assignedShift.work_shift.start_time.toISOString().slice(11, 16),
        end_time: assignedShift.work_shift.end_time.toISOString().slice(11, 16),
      }
    : null;

  return {
    employee: {
      employment_id: employment.id,
      company_member_id: memberId,
      employee_no: employment.employee_no,
      name:
        employment.hr_profile?.full_name ?? employment.workforce_person.phone_no ?? 'Unknown',
      designation: employment.hr_profile?.designation?.name ?? null,
      department:
        employment.company_member.department?.name ?? employment.hr_profile?.department?.name ?? null,
      assigned_shift: assigned,
    },
    from: range.from,
    to: range.to,
    attendance_rate: attendanceRate,
    summary: {
      ...summary,
      ot_hours: Math.round((summary.ot_minutes / 60) * 10) / 10,
      worked_hours: Math.round((summary.worked_minutes / 60) * 10) / 10,
    },
    days,
    entries,
  };
}
